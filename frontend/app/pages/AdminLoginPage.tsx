import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Activity, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast }               from 'sonner';
import { Button }              from '../components/ui/button';
import { Input }               from '../components/ui/input';
import { Label }               from '../components/ui/label';
import { Card, CardContent }   from '../components/ui/card';
import { adminApi, adminTokenStore, ApiError } from '../lib/api';

interface AdminLoginFormData { email: string; password: string; }

export default function AdminLoginPage() {
  const navigate     = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const reqCtrlRef = useRef<AbortController | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginFormData>();

  const onSubmit = handleSubmit(async (data) => {
    if (loading) return;
    const email = data.email.trim();
    if (!email || !data.password) return;
    reqCtrlRef.current?.abort();
    const ctrl = new AbortController();
    reqCtrlRef.current = ctrl;
    setLoading(true);
    try {
      const { token } = await adminApi.login({ email, password: data.password }, { signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      adminTokenStore.set(token);
      toast.success('Login realizado com sucesso!');
      navigate('/admin/dashboard');
    } catch (err) {
      if (ctrl.signal.aborted) return;
      if (err instanceof ApiError && err.status === 401) {
        toast.error('Credenciais inválidas.');
      } else {
        toast.error((err as Error).message ?? 'Erro ao conectar.');
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  });

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">HealthFlow</div>
            <div className="text-sm text-gray-400">Administração</div>
          </div>
        </Link>

        <Card className="border-gray-700 bg-gray-800 shadow-xl">
          <CardContent className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">Acesso Admin</h1>
              <p className="text-gray-400 text-sm">Entre com suas credenciais administrativas</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-gray-300">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input id="email" type="email" placeholder="admin@healthflow.com"
                    className={`pl-9 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500
                      ${errors.email ? 'border-red-500' : ''}`}
                    disabled={loading}
                    {...register('email', {
                      required: 'E-mail é obrigatório',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'E-mail inválido' },
                    })} />
                </div>
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-gray-300">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input id="password" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                    className={`pl-9 pr-9 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500
                      ${errors.password ? 'border-red-500' : ''}`}
                    disabled={loading}
                    {...register('password', { required: 'Senha é obrigatória' })} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    disabled={loading} aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}>
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}>
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Entrando...</>
                  : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-400 hover:text-white">← Voltar para o site</Link>
        </div>
      </div>
    </div>
  );
}
