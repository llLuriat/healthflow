import { useEffect, useState } from 'react';
import { CreditCard, TrendingUp, Users, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent }   from '../components/ui/card';
import { AdminLayout }         from '../layouts/AdminLayout';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { adminApi, AdminClient, ApiError } from '../lib/api';

export default function AdminAssinaturasPage() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    adminApi.listClients()
      .then(setClients)
      .catch((err: ApiError) => setError(err.message ?? 'Erro ao carregar dados'))
      .finally(() => setLoading(false));
  }, []);

  // Dados calculados do banco — sem valores fictícios
  const totalClients  = clients.length;
  const totalUsers    = clients.reduce((s, c) => s + c.total_users, 0);
  const totalConsultas = clients.reduce((s, c) => s + c.total_consultas, 0);

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Assinaturas</h1>
          <p className="text-gray-400 text-sm">Visão de uso da plataforma por clínica</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Clínicas Ativas</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{totalClients}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Total Usuários</span>
                <CreditCard className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700 col-span-2 lg:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Total Consultas</span>
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{totalConsultas}</div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card className="bg-red-900/20 border-red-500/30 mb-4">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <Card className="bg-gray-800 border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-base font-semibold text-white">Uso por Clínica</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Módulo financeiro / cobrança será integrado via Stripe em versão futura.
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Clínica</TableHead>
                    <TableHead className="text-gray-400">Usuários</TableHead>
                    <TableHead className="text-gray-400 hidden md:table-cell">Consultas</TableHead>
                    <TableHead className="text-gray-400 hidden lg:table-cell">Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-10">
                        Nenhuma clínica cadastrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map(c => (
                      <TableRow key={c.id} className="border-gray-700 hover:bg-gray-700/30">
                        <TableCell className="text-white font-medium">
                          <div>{c.name}</div>
                          {c.segment && <div className="text-xs text-gray-500">{c.segment}</div>}
                        </TableCell>
                        <TableCell className="text-gray-400">{c.total_users}</TableCell>
                        <TableCell className="text-gray-400 hidden md:table-cell">{c.total_consultas}</TableCell>
                        <TableCell className="text-gray-500 text-xs hidden lg:table-cell">
                          {new Date(c.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
