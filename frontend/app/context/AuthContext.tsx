/**
 * AuthContext — Estado global de autenticação
 *
 * - tenantId SEMPRE vem do JWT (nunca de header arbitrário)
 * - Valida expiração do token na montagem (sem chamar o backend)
 * - Expõe login / loginByEmail / register / logout
 */
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { authApi, tokenStore, tenantStore, MultiTenantResponse } from '../lib/api';

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const pad  = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(pad.padEnd(pad.length + ((4 - (pad.length % 4)) % 4), '='));
    return JSON.parse(json);
  } catch { return null; }
}

function isTokenExpired(token: string): boolean {
  const p   = decodeJwt(token);
  if (!p) return true;
  const exp = typeof p.exp === 'number' ? p.exp : null;
  if (exp === null) return true;
  return Date.now() / 1000 >= exp;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthState {
  isAuthenticated: boolean;
  tenantId:        string | null;
  userId:          string | null;
  role:            string | null;
  isLoading:       boolean;
}

interface AuthCtx extends AuthState {
  login(tenantId: string, email: string, password: string): Promise<void>;
  loginByEmail(email: string, password: string): Promise<void | MultiTenantResponse>;
  register(tenantName: string, email: string, password: string): Promise<{ tenantId: string }>;
  logout(): void;
}

const Ctx = createContext<AuthCtx | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false, tenantId: null, userId: null, role: null, isLoading: true,
  });

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = tokenStore.get();
    if (!token || isTokenExpired(token)) {
      tokenStore.clear();
      setState(s => ({ ...s, isLoading: false }));
      return;
    }
    const payload       = decodeJwt(token);
    const tenantIdFromJwt = (payload?.tenantId as string | undefined) ?? null;
    if (!tenantIdFromJwt) {
      tokenStore.clear();
      setState(s => ({ ...s, isLoading: false }));
      return;
    }
    setState({
      isAuthenticated: true,
      tenantId: tenantIdFromJwt,
      userId:   (payload?.userId as string) ?? null,
      role:     (payload?.role   as string) ?? null,
      isLoading: false,
    });
  }, []);

  const login = useCallback(async (tenantId: string, email: string, password: string) => {
    const { token } = await authApi.login({ tenantId, email, password });
    tokenStore.set(token);
    tenantStore.set(tenantId);
    const payload = decodeJwt(token);
    setState({
      isAuthenticated: true,
      tenantId,
      userId: (payload?.userId as string) ?? null,
      role:   (payload?.role   as string) ?? null,
      isLoading: false,
    });
  }, []);

  // Login simplificado: apenas email + senha (resolve tenant automaticamente)
  const loginByEmail = useCallback(async (email: string, password: string) => {
    const result = await authApi.loginByEmail({ email, password });

    // Em conflito de múltiplos tenants, retorna lista para o caller tratar.
    if ('tenants' in result) {
      return result as MultiTenantResponse;
    }

    const { token, tenantId } = result as { token: string; tenantId?: string };
    tokenStore.set(token);
    if (tenantId) tenantStore.set(tenantId);
    const payload = decodeJwt(token);
    setState({
      isAuthenticated: true,
      tenantId:  (payload?.tenantId as string) ?? tenantId ?? null,
      userId:    (payload?.userId   as string) ?? null,
      role:      (payload?.role     as string) ?? null,
      isLoading: false,
    });
  }, []);

  const register = useCallback(async (tenantName: string, email: string, password: string) => {
    const result = await authApi.register({ tenantName, email, password });
    tenantStore.set(result.tenantId);
    return { tenantId: result.tenantId };
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setState({ isAuthenticated: false, tenantId: null, userId: null, role: null, isLoading: false });
    window.location.href = '/login';
  }, []);

  return (
    <Ctx.Provider value={{ ...state, login, loginByEmail, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
