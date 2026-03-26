import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Activity, Mail, Lock, Eye, EyeOff, Loader2, Building2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button }              from '../components/ui/button';
import { Input }               from '../components/ui/input';
import { Label }               from '../components/ui/label';
import { Card, CardContent }   from '../components/ui/card';
import { useAuth }             from '../context/AuthContext';
import { ApiError, MultiTenantResponse } from '../lib/api';

type Mode = 'email' | 'tenant';

interface EmailForm  { email: string; password: string; }
interface TenantForm { tenantId: string; email: string; password: string; }

export default function LoginPage() {
  const navigate    = useNavigate();
  const { login, loginByEmail } = useAuth();
  const [mode, setMode]     = useState<Mode>('email');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  // Múltiplos tenants — usuário precisa escolher
  const [multiTenants, setMultiTenants] = useState<MultiTenantResponse['tenants'] | null>(null);
  const [pendingCreds, setPendingCreds] = useState<EmailForm | null>(null);
  const reqCtrlRef = useRef<AbortController | null>(null);

  const emailForm  = useForm<EmailForm>();
  const tenantForm = useForm<TenantForm>({ defaultValues: { tenantId: '' } });

  // ── Login por e-mail (modo padrão) ──────────────────────────────────────────
  const onEmailSubmit = emailForm.handleSubmit(async (data) => {
    if (loading) return;
    const email = data.email.trim();
    if (!email || !data.password) return;
    reqCtrlRef.current?.abort();
    const ctrl = new AbortController();
    reqCtrlRef.current = ctrl;
    setLoading(true);
    setMultiTenants(null);
    try {
      const result = await loginByEmail(email, data.password);
      if (ctrl.signal.aborted) return;
      if (result && 'tenants' in result) {
        // Múltiplos tenants — apresenta escolha
        setMultiTenants(result.tenants);
        setPendingCreds(data);
        return;
      }
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (err) {
      if (ctrl.signal.aborted) return;
      if (err instanceof ApiError && err.status === 401) {
        toast.error('E-mail ou senha incorretos.');
      } else {
        toast.error((err as Error).message ?? 'Erro ao conectar com o servidor.');
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  });

  // Usuário escolheu um tenant (caso de múltiplos)
  const selectTenant = async (tenantId: string) => {
    if (!pendingCreds || loading) return;
    setLoading(true);
    try {
      await login(tenantId, pendingCreds.email.trim(), pendingCreds.password);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch {
      toast.error('Falha ao entrar com a clínica selecionada.');
    } finally {
      setLoading(false);
    }
  };

  // ── Login com Tenant ID (modo avançado) ──────────────────────────────────────
  const onTenantSubmit = tenantForm.handleSubmit(async (data) => {
    if (loading) return;
    const tenantId = data.tenantId.trim();
    const email = data.email.trim();
    if (!tenantId || !email || !data.password) return;
    setLoading(true);
    try {
      await login(tenantId, email, data.password);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error('Credenciais inválidas. Verifique Tenant ID, e-mail e senha.');
      } else {
        toast.error((err as Error).message ?? 'Erro ao conectar com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: 'var(--hf-primary)' }}>
            <Activity className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold text-gray-900">HealthFlow</span>
        </Link>

        <Card className="border-gray-200 shadow-xl">
          <CardContent className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo de volta</h1>
              <p className="text-gray-600 text-sm">Entre com suas credenciais para continuar</p>
            </div>

            {/* ── Seleção de modo ── */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setMode('email')}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors
                  ${mode === 'email' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Por e-mail
              </button>
              <button
                onClick={() => setMode('tenant')}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors
                  ${mode === 'tenant' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Com Tenant ID
              </button>
            </div>

            {/* ── Múltiplos tenants ── */}
            {multiTenants && (
              <div className="mb-4 space-y-2">
                <p className="text-sm text-gray-600 font-medium mb-3">
                  Sua conta está associada a mais de uma clínica. Selecione:
                </p>
                {multiTenants.map((t) => (
                  <button
                    key={t.tenantId}
                    onClick={() => selectTenant(t.tenantId)}
                    disabled={loading}
                    className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                  >
                    <span className="font-medium text-gray-900">{t.tenantName}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
                  </button>
                ))}
                <button onClick={() => setMultiTenants(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 mt-2">
                  ← Usar outro e-mail
                </button>
              </div>
            )}

            {/* ── Formulário por e-mail ── */}
            {!multiTenants && mode === 'email' && (
              <form onSubmit={onEmailSubmit} className="space-y-5">
                <div className="space-y-1">
                  <Label htmlFor="email-field">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="email-field" type="email" placeholder="seu@email.com"
                      className={`pl-9 ${emailForm.formState.errors.email ? 'border-red-500' : ''}`}
                      disabled={loading}
                      {...emailForm.register('email', {
                        required: 'E-mail é obrigatório',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'E-mail inválido' },
                      })} />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-xs text-red-600">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="pwd-field">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="pwd-field" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                      className={`pl-9 pr-9 ${emailForm.formState.errors.password ? 'border-red-500' : ''}`}
                      disabled={loading}
                      {...emailForm.register('password', { required: 'Senha é obrigatória' })} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}>
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {emailForm.formState.errors.password && (
                    <p className="text-xs text-red-600">{emailForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full text-white"
 disabled={loading}>
                  {loading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Entrando...</>
                    : 'Entrar'}
                </Button>
              </form>
            )}

            {/* ── Formulário com Tenant ID ── */}
            {!multiTenants && mode === 'tenant' && (
              <form onSubmit={onTenantSubmit} className="space-y-5">
                <div className="space-y-1">
                  <Label htmlFor="tenantId">ID da Clínica (Tenant ID)</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="tenantId" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className={`pl-9 font-mono text-xs ${tenantForm.formState.errors.tenantId ? 'border-red-500' : ''}`}
                      disabled={loading}
                      {...tenantForm.register('tenantId', {
                        required: 'ID da clínica é obrigatório',
                        pattern: {
                          value: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
                          message: 'Deve ser um UUID válido',
                        },
                      })} />
                  </div>
                  {tenantForm.formState.errors.tenantId
                    ? <p className="text-xs text-red-600">{tenantForm.formState.errors.tenantId.message}</p>
                    : <p className="text-xs text-gray-400">Recebido por e-mail ao criar sua conta</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="tenant-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="tenant-email" type="email" placeholder="seu@email.com"
                      className={`pl-9 ${tenantForm.formState.errors.email ? 'border-red-500' : ''}`}
                      disabled={loading}
                      {...tenantForm.register('email', {
                        required: 'E-mail é obrigatório',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'E-mail inválido' },
                      })} />
                  </div>
                  {tenantForm.formState.errors.email && (
                    <p className="text-xs text-red-600">{tenantForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="tenant-pwd">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="tenant-pwd" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                      className={`pl-9 pr-9 ${tenantForm.formState.errors.password ? 'border-red-500' : ''}`}
                      disabled={loading}
                      {...tenantForm.register('password', { required: 'Senha é obrigatória' })} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}>
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {tenantForm.formState.errors.password && (
                    <p className="text-xs text-red-600">{tenantForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full text-white"
 disabled={loading}>
                  {loading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Entrando...</>
                    : 'Entrar'}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Não tem uma conta?{' '}
                <Link to="/primeiro-acesso" className="font-medium hover:underline"
                  style={{ color: 'var(--hf-primary)' }}>
                  Criar conta grátis
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-5 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  );
}
