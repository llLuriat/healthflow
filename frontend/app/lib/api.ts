/**
 * api.ts — Cliente HTTP centralizado do HealthFlow
 * Sem axios, sem mocks — fetch nativo puro.
 */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const TOKEN_KEY     = 'hf_token';
const TENANT_ID_KEY = 'hf_tenant_id';
const ADMIN_TOKEN_KEY = 'hf_admin_token';

export const tokenStore = {
  get():           string | null { return localStorage.getItem(TOKEN_KEY); },
  set(t: string):  void          { localStorage.setItem(TOKEN_KEY, t); },
  clear():         void          {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TENANT_ID_KEY);
  },
};

export const tenantStore = {
  get():           string | null { return localStorage.getItem(TENANT_ID_KEY); },
  set(id: string): void          { localStorage.setItem(TENANT_ID_KEY, id); },
};

export const adminTokenStore = {
  get():           string | null { return localStorage.getItem(ADMIN_TOKEN_KEY); },
  set(t: string):  void          { localStorage.setItem(ADMIN_TOKEN_KEY, t); },
  clear():         void          { localStorage.removeItem(ADMIN_TOKEN_KEY); },
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Opts extends Omit<RequestInit, 'body'> {
  body?:             unknown;
  qs?:               Record<string, string | undefined>;
  skipAuthRedirect?: boolean;
  adminAuth?:        boolean;
}

function parseErrorPayload(payload: unknown): { code: string; message: string } {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    (payload as { error?: unknown }).error &&
    typeof (payload as { error?: unknown }).error === 'object'
  ) {
    const errObj = (payload as { error: { code?: unknown; message?: unknown } }).error;
    const code = typeof errObj.code === 'string' ? errObj.code : 'request_error';
    const message = typeof errObj.message === 'string' ? errObj.message : 'Erro na requisição';
    return { code, message };
  }

  if (payload && typeof payload === 'object') {
    const p = payload as { error?: unknown; message?: unknown };
    const legacyMessage =
      typeof p.error === 'string' ? p.error : typeof p.message === 'string' ? p.message : null;
    if (legacyMessage) {
      return { code: 'request_error', message: legacyMessage };
    }
  }

  return { code: 'request_error', message: 'Erro na requisição' };
}

function fallbackErrorByStatus(status: number): { code: string; message: string } {
  if (status === 400) return { code: 'validation_error', message: 'Dados inválidos.' };
  if (status === 401) return { code: 'unauthorized', message: 'Sessão expirada. Faça login novamente.' };
  if (status === 403) return { code: 'forbidden', message: 'Acesso negado.' };
  if (status === 404) return { code: 'not_found', message: 'Recurso não encontrado.' };
  if (status === 409) return { code: 'conflict', message: 'Conflito de dados.' };
  if (status >= 500) return { code: 'internal_error', message: 'Erro interno. Tente novamente.' };
  return { code: 'request_error', message: `HTTP ${status}` };
}

export async function apiFetch<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const { body, qs, headers: extraHeaders, skipAuthRedirect, adminAuth, ...rest } = opts;

  let url = `${BASE}${path}`;
  if (qs) {
    const params = new URLSearchParams(
      Object.entries(qs).filter(([, v]) => v !== undefined) as [string, string][],
    );
    const str = params.toString();
    if (str) url += `?${str}`;
  }

  const token = adminAuth ? adminTokenStore.get() : tokenStore.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    const isAuthRoute = path.startsWith('/auth/') || path.startsWith('/admin/login');
    if (!isAuthRoute && !skipAuthRedirect) {
      if (adminAuth) {
        adminTokenStore.clear();
        window.location.href = '/admin/login';
      } else {
        tokenStore.clear();
        window.location.href = '/login';
      }
      throw new ApiError(401, 'unauthorized', 'Sessão expirada. Faça login novamente.');
    }
    throw new ApiError(401, 'unauthorized', 'Não autorizado.');
  }

  if (!res.ok) {
    let payload: unknown = undefined;
    try { payload = await res.json(); } catch { /* ignore */ }
    const parsed = parseErrorPayload(payload);
    const fallback = fallbackErrorByStatus(res.status);
    const code = parsed.code === 'request_error' ? fallback.code : parsed.code;
    const message = parsed.message === 'Erro na requisição' ? fallback.message : parsed.message;
    throw new ApiError(res.status, code, message, payload);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiClient = {
  request: apiFetch,
};

export function getApiErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return (err as Error)?.message ?? 'Erro inesperado.';
  }
  return err.message;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface RegisterPayload      { tenantName: string; email: string; password: string; }
export interface RegisterResponse     { tenantId: string; userId: string; email: string; }
export interface LoginPayload         { tenantId: string; email: string; password: string; }
export interface LoginByEmailPayload  { email: string; password: string; }
export interface LoginResponse        { token: string; tenantId?: string; tenantName?: string; }
export interface MultiTenantResponse  {
  message: string;
  tenants: Array<{ tenantId: string; tenantName: string }>;
}

export const authApi = {
  register:     (p: RegisterPayload, opts?: Opts) =>
    apiFetch<RegisterResponse>('/auth/register',        { method: 'POST', body: p, skipAuthRedirect: true, ...(opts ?? {}) }),
  login:        (p: LoginPayload, opts?: Opts) =>
    apiFetch<LoginResponse>('/auth/login',              { method: 'POST', body: p, skipAuthRedirect: true, ...(opts ?? {}) }),
  loginByEmail: (p: LoginByEmailPayload, opts?: Opts) =>
    apiFetch<LoginResponse>('/auth/login-by-email', { method: 'POST', body: p, skipAuthRedirect: true, ...(opts ?? {}) })
      .catch((err: unknown) => {
        if (
          err instanceof ApiError &&
          err.status === 409 &&
          err.code === 'tenant_conflict' &&
          err.details &&
          typeof err.details === 'object' &&
          'tenants' in err.details
        ) {
          return err.details as MultiTenantResponse;
        }
        throw err;
      }),
};

// ─── Settings (clínica) ───────────────────────────────────────────────────────
export interface ClinicSettings {
  id:            string;
  name:          string;
  segment:       string | null;
  phone:         string | null;
  address:       string | null;
  email_contact: string | null;
  primary_color: string | null;
  logo_url:      string | null;
}

export interface UpdateSettingsPayload {
  name:          string;
  segment?:      string;
  phone?:        string;
  address?:      string;
  email_contact?: string;
  primary_color?: string;
}

export const settingsApi = {
  get:    (opts?: Opts)                         => apiFetch<ClinicSettings>('/settings', { method: 'GET', ...(opts ?? {}) }),
  update: (p: UpdateSettingsPayload, opts?: Opts) => apiFetch<ClinicSettings>('/settings', { method: 'PUT', body: p, ...(opts ?? {}) }),
};

// ─── Consultas ────────────────────────────────────────────────────────────────
export type ConsultaStatus =
  | 'scheduled' | 'in-progress' | 'delayed' | 'finished' | 'cancelled';

export interface Consulta {
  id:             string;
  tenant_id:      string;
  patient_name:   string;
  professional:   string;
  room:           string;
  scheduled_time: string;
  status:         ConsultaStatus;
  delay_minutes:  number;
  notes:          string | null;
  created_at:     string;
  updated_at?:    string;
}

export interface CreateConsultaPayload {
  patient_name:   string;
  professional:   string;
  room?:          string;
  scheduled_time: string;
  notes?:         string;
}

export const consultasApi = {
  list:   (date?: string, opts?: Opts) =>
    apiFetch<Consulta[]>('/consultas', { method: 'GET', qs: date ? { date } : undefined, ...(opts ?? {}) }),
  get:    (id: string) =>
    apiFetch<Consulta>(`/consultas/${id}`, { method: 'GET' }),
  create: (p: CreateConsultaPayload, opts?: Opts) =>
    apiFetch<Consulta>('/consultas', { method: 'POST', body: p, ...(opts ?? {}) }),
  updateEstado: (id: string, estado: ConsultaStatus, delay_minutes = 0, opts?: Opts) =>
    apiFetch<Consulta>(`/consultas/${id}/estado`, { method: 'PATCH', body: { estado, delay_minutes }, ...(opts ?? {}) }),
  cancel: (id: string, opts?: Opts) =>
    apiFetch<{ id: string; status: string }>(`/consultas/${id}`, { method: 'DELETE', ...(opts ?? {}) }),
};

// ─── Patients ─────────────────────────────────────────────────────────────────
export interface Patient {
  id: string; tenant_id: string; name: string;
  birth_date: string | null; notes: string | null; created_at: string;
}

export const patientsApi = {
  list:   () => apiFetch<Patient[]>('/patients', { method: 'GET' }),
  get:    (id: string) => apiFetch<Patient>(`/patients/${id}`, { method: 'GET' }),
  create: (p: { name: string; birth_date?: string; notes?: string }) =>
    apiFetch<Patient>('/patients', { method: 'POST', body: p }),
};

// ─── Professionals ────────────────────────────────────────────────────────────
export interface Professional {
  id:         string;
  tenant_id:  string;
  name:       string;
  specialty:  string;
  email:      string | null;
  phone:      string | null;
  room:       string;
  status:     'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateProfessionalPayload {
  name:       string;
  specialty?: string;
  email?:     string;
  phone?:     string;
  room?:      string;
}

export const professionalsApi = {
  list:   (includeInactive = false, opts?: Opts) =>
    apiFetch<Professional[]>('/professionals', {
      method: 'GET',
      qs: includeInactive ? { includeInactive: 'true' } : undefined,
      ...(opts ?? {}),
    }),
  get:    (id: string) =>
    apiFetch<Professional>(`/professionals/${id}`, { method: 'GET' }),
  create: (p: CreateProfessionalPayload, opts?: Opts) =>
    apiFetch<Professional>('/professionals', { method: 'POST', body: p, ...(opts ?? {}) }),
  update: (id: string, p: CreateProfessionalPayload & { status?: string }, opts?: Opts) =>
    apiFetch<Professional>(`/professionals/${id}`, { method: 'PUT', body: p, ...(opts ?? {}) }),
  remove: (id: string, opts?: Opts) =>
    apiFetch<{ id: string; status: string }>(`/professionals/${id}`, { method: 'DELETE', ...(opts ?? {}) }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface AdminLoginPayload   { email: string; password: string; }
export interface AdminLoginResponse  { token: string; }
export interface AdminStats {
  totalInstitutions: number;
  totalUsers:        number;
  consultasHoje:     number;
}
export interface AdminClient {
  id:              string;
  name:            string;
  segment:         string | null;
  email_contact:   string | null;
  created_at:      string;
  total_users:     number;
  total_consultas: number;
}

export const adminApi = {
  login:      (p: AdminLoginPayload, opts?: Opts) =>
    apiFetch<AdminLoginResponse>('/admin/login', { method: 'POST', body: p, skipAuthRedirect: true, ...(opts ?? {}) }),
  getStats:   () =>
    apiFetch<AdminStats>('/admin/stats',   { method: 'GET', adminAuth: true }),
  listClients: () =>
    apiFetch<AdminClient[]>('/admin/clients', { method: 'GET', adminAuth: true }),
};
