import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router';
import {
  BarChart3, Clock, Plus, Search, Calendar, ExternalLink, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button }                         from '../components/ui/button';
import { Card, CardContent }              from '../components/ui/card';
import { Input }                          from '../components/ui/input';
import { StatusBadge }                    from '../components/StatusBadge';
import { EmptyState }                     from '../components/EmptyState';
import { InstitutionLayout }              from '../layouts/InstitutionLayout';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { consultasApi, Consulta, ConsultaStatus, getApiErrorMessage } from '../lib/api';

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}
function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); }
  catch { return ''; }
}
function todayISO() { return new Date().toISOString().split('T')[0]; }

const STATUS_LABELS: Record<ConsultaStatus, string> = {
  scheduled:     'Agendada',
  'in-progress': 'Em andamento',
  delayed:       'Atrasada',
  finished:      'Finalizada',
  cancelled:     'Cancelada',
};

export default function AppointmentsPage() {
  const [items, setItems]       = useState<Consulta[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [searchQuery, setSearch] = useState('');
  const [filterStatus, setFilter] = useState<ConsultaStatus | 'all'>('all');
  const [dateFilter, setDate]   = useState(todayISO());
  const loadCtrlRef = useRef<AbortController | null>(null);
  const loadSeqRef = useRef(0);
  const updatingRef = useRef(false);

  const load = useCallback(async () => {
    loadCtrlRef.current?.abort();
    const ctrl = new AbortController();
    loadCtrlRef.current = ctrl;
    const seq = ++loadSeqRef.current;
    setLoading(true); setError(null);
    try {
      const data = await consultasApi.list(dateFilter || undefined, { signal: ctrl.signal });
      if (seq !== loadSeqRef.current || ctrl.signal.aborted) return;
      setItems(data);
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(getApiErrorMessage(e));
    } finally {
      if (seq === loadSeqRef.current && !ctrl.signal.aborted) setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    load();
    return () => loadCtrlRef.current?.abort();
  }, [load]);

  const filtered = items.filter((c) => {
    const matchSearch =
      c.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.professional.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.room ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Atualiza status de uma consulta inline
  const handleStatusChange = async (id: string, estado: ConsultaStatus) => {
    if (updatingRef.current) return;
    updatingRef.current = true;
    try {
      const updated = await consultasApi.updateEstado(id, estado);
      setItems(prev => prev.map(c => c.id === id ? updated : c));
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      updatingRef.current = false;
    }
  };

  return (
    <InstitutionLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Atendimentos</h1>
            <p className="text-gray-600 text-sm">Visão geral de todas as consultas</p>
          </div>
          <Link to="/consultas">
            <Button className="text-white">
              <Plus className="w-4 h-4 mr-2" /> Gerenciar Consultas
            </Button>
          </Link>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar por paciente, profissional ou sala..."
              className="pl-9" value={searchQuery}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <input type="date" value={dateFilter}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <Select value={filterStatus} onValueChange={(v) => setFilter(v as ConsultaStatus | 'all')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {(Object.keys(STATUS_LABELS) as ConsultaStatus[]).map(s => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Erro */}
        {error && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={<BarChart3 className="w-10 h-10 text-gray-300" />}
            title="Nenhum atendimento encontrado"
            description={searchQuery || filterStatus !== 'all'
              ? 'Tente ajustar os filtros.'
              : `Sem consultas para ${dateFilter || 'esta data'}.`}
          />
        )}

        {/* Tabela */}
        {!loading && filtered.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Horário</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Sala</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Atraso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        <div>{fmtTime(c.scheduled_time)}</div>
                        <div className="text-xs text-gray-400">{fmtDate(c.scheduled_time)}</div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{c.patient_name}</TableCell>
                      <TableCell className="text-gray-600">{c.professional}</TableCell>
                      <TableCell className="text-gray-600">{c.room || '—'}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell>
                        {c.delay_minutes > 0
                          ? <span className="text-xs text-orange-600 font-medium">{c.delay_minutes} min</span>
                          : <span className="text-xs text-gray-400">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Link para a página do paciente */}
                          <Link to={`/patient-view?id=${c.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                            </Button>
                          </Link>
                          {/* Acão rápida: iniciar atendimento */}
                          {c.status === 'scheduled' && (
                            <Button variant="outline" size="sm" className="text-xs h-7"
                              onClick={() => handleStatusChange(c.id, 'in-progress')}>
                              <Clock className="w-3 h-3 mr-1" /> Iniciar
                            </Button>
                          )}
                          {c.status === 'in-progress' && (
                            <Button variant="outline" size="sm" className="text-xs h-7 text-green-600 border-green-300"
                              onClick={() => handleStatusChange(c.id, 'finished')}>
                              Finalizar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-3 border-t border-gray-100 text-xs text-gray-500 text-right">
              {filtered.length} de {items.length} atendimento(s)
            </div>
          </Card>
        )}
      </div>
    </InstitutionLayout>
  );
}
