import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Shield, LogOut, TrendingUp, Users, Building2, Activity,
  AlertCircle, CheckCircle2, Clock, Loader2, Menu, X,
} from 'lucide-react';
import { Button }              from '../components/ui/button';
import { Card, CardContent }   from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { adminApi, adminTokenStore, AdminStats, AdminClient, ApiError } from '../lib/api';

export default function AdminDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats]             = useState<AdminStats | null>(null);
  const [clients, setClients]         = useState<AdminClient[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.listClients()])
      .then(([s, c]) => { setStats(s); setClients(c); })
      .catch((err: ApiError) => setError(err.message ?? 'Erro ao carregar dados'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    adminTokenStore.clear();
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          <span className="font-semibold text-white">Admin</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white p-1">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-gray-800 border-r border-gray-700 flex flex-col z-40 transition-transform lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm">HealthFlow</div>
              <div className="text-xs text-gray-400">Administração</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link to="/admin/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium">
            <Activity className="w-4 h-4" /> Dashboard
          </Link>
          <Link to="/admin/clientes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-700 text-sm">
            <Building2 className="w-4 h-4" /> Clientes
          </Link>
          <Link to="/admin/assinaturas"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-700 text-sm">
            <TrendingUp className="w-4 h-4" /> Assinaturas
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-700"
            onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Content */}
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-gray-400 text-sm">Visão geral da plataforma HealthFlow</p>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        )}

        {error && (
          <Card className="bg-red-900/20 border-red-500/30 mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && stats && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Clínicas Cadastradas</span>
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.totalInstitutions}</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Usuários Totais</span>
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Consultas Hoje</span>
                    <Activity className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.consultasHoje}</div>
                  <div className="text-xs text-gray-500 mt-1">Tempo real</div>
                </CardContent>
              </Card>
            </div>

            {/* Clients table */}
            <Card className="bg-gray-800 border-gray-700">
              <div className="p-5 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Clínicas</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{clients.length} cadastrada(s)</p>
                </div>
                <Link to="/admin/clientes">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                    Ver todas
                  </Button>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-400">Clínica</TableHead>
                      <TableHead className="text-gray-400 hidden md:table-cell">Usuários</TableHead>
                      <TableHead className="text-gray-400 hidden lg:table-cell">Consultas</TableHead>
                      <TableHead className="text-gray-400">Desde</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.slice(0, 8).map(c => (
                      <TableRow key={c.id} className="border-gray-700 hover:bg-gray-700/30">
                        <TableCell className="font-medium text-white">
                          <div>{c.name}</div>
                          {c.segment && <div className="text-xs text-gray-500">{c.segment}</div>}
                        </TableCell>
                        <TableCell className="text-gray-400 hidden md:table-cell">{c.total_users}</TableCell>
                        <TableCell className="text-gray-400 hidden lg:table-cell">{c.total_consultas}</TableCell>
                        <TableCell className="text-gray-500 text-xs">
                          {new Date(c.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}

        {!loading && !error && clients.length === 0 && (
          <Card className="bg-gray-800 border-gray-700 mt-6">
            <CardContent className="p-8 text-center">
              <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Nenhuma clínica cadastrada ainda.</p>
            </CardContent>
          </Card>
        )}

        {!loading && stats && stats.totalInstitutions > 0 && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 mt-6">
            <CardContent className="p-5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-300 font-medium">
                  {stats.totalInstitutions} clínica(s) ativa(s) · {stats.consultasHoje} consulta(s) hoje
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Dados atualizados em tempo real direto do banco de dados.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
