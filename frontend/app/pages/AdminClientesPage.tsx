import { useEffect, useState } from 'react';
import { Users, TrendingUp, Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button }              from '../components/ui/button';
import { Card, CardContent }   from '../components/ui/card';
import { Input }               from '../components/ui/input';
import { AdminLayout }         from '../layouts/AdminLayout';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { adminApi, AdminClient, ApiError } from '../lib/api';

export default function AdminClientesPage() {
  const [clients, setClients]   = useState<AdminClient[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');

  const load = () => {
    setLoading(true); setError(null);
    adminApi.listClients()
      .then(setClients)
      .catch((err: ApiError) => setError(err.message ?? 'Erro ao carregar clientes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email_contact ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const totalUsers    = clients.reduce((s, c) => s + c.total_users,    0);
  const totalConsultas = clients.reduce((s, c) => s + c.total_consultas, 0);

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Clientes</h1>
            <p className="text-gray-400 text-sm">Todas as clínicas cadastradas na plataforma</p>
          </div>
          <Button variant="outline" size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 gap-2"
            onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Total de Clínicas</span>
                <Users className="w-4 h-4 text-gray-500" />
              </div>
              <div className="text-2xl font-bold text-white">{clients.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Usuários Totais</span>
                <Users className="w-4 h-4 text-gray-500" />
              </div>
              <div className="text-2xl font-bold text-white">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700 col-span-2 lg:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Consultas Cadastradas</span>
                <TrendingUp className="w-4 h-4 text-gray-500" />
              </div>
              <div className="text-2xl font-bold text-white">{totalConsultas}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input placeholder="Buscar por nome ou e-mail..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
        </div>

        {/* Error */}
        {error && (
          <Card className="bg-red-900/20 border-red-500/30 mb-4">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        )}

        {/* Table */}
        {!loading && (
          <Card className="bg-gray-800 border-gray-700">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Clínica</TableHead>
                    <TableHead className="text-gray-400 hidden md:table-cell">Segmento</TableHead>
                    <TableHead className="text-gray-400 hidden md:table-cell">Usuários</TableHead>
                    <TableHead className="text-gray-400 hidden lg:table-cell">Consultas</TableHead>
                    <TableHead className="text-gray-400">Desde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-12">
                        {search ? 'Nenhuma clínica encontrada para este termo.' : 'Nenhuma clínica cadastrada.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(c => (
                      <TableRow key={c.id} className="border-gray-700 hover:bg-gray-700/30">
                        <TableCell className="text-white font-medium">
                          <div>{c.name}</div>
                          {c.email_contact && (
                            <div className="text-xs text-gray-500">{c.email_contact}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-400 hidden md:table-cell text-sm">
                          {c.segment ?? '—'}
                        </TableCell>
                        <TableCell className="text-gray-400 hidden md:table-cell">{c.total_users}</TableCell>
                        <TableCell className="text-gray-400 hidden lg:table-cell">{c.total_consultas}</TableCell>
                        <TableCell className="text-gray-500 text-xs">
                          {new Date(c.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {filtered.length > 0 && (
              <div className="p-3 border-t border-gray-700 text-xs text-gray-500 text-right">
                {filtered.length} de {clients.length} clínica(s)
              </div>
            )}
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
