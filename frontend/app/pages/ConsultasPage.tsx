import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Loader2, AlertCircle, RefreshCw, Clock, Trash2, Calendar } from 'lucide-react';
import { toast }              from 'sonner';
import { Button }             from '../components/ui/button';
import { Card }               from '../components/ui/card';
import { Input }              from '../components/ui/input';
import { Label }              from '../components/ui/label';
import { StatusBadge }        from '../components/StatusBadge';
import { EmptyState }         from '../components/EmptyState';
import { InstitutionLayout }  from '../layouts/InstitutionLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { consultasApi, Consulta, ConsultaStatus, CreateConsultaPayload, getApiErrorMessage } from '../lib/api';

const STATUS_LABELS: Record<ConsultaStatus, string> = {
  scheduled:     'Agendada',
  'in-progress': 'Em andamento',
  delayed:       'Atrasada',
  finished:      'Finalizada',
  cancelled:     'Cancelada',
};

const TRANSITIONS: Record<ConsultaStatus, ConsultaStatus[]> = {
  scheduled:     ['in-progress', 'delayed', 'cancelled'],
  'in-progress': ['finished', 'delayed', 'cancelled'],
  delayed:       ['in-progress', 'finished', 'cancelled'],
  finished:      [],
  cancelled:     [],
};

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}
function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); }
  catch { return ''; }
}
function defaultDateTime() {
  const d = new Date(); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1);
  return d.toISOString().slice(0, 16);
}

interface NewForm {
  patient_name: string; professional: string; room: string;
  scheduled_time: string; notes: string;
}

export default function ConsultasPage() {
  const [items, setItems]       = useState<Consulta[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<ConsultaStatus | 'all'>('all');
  const [dialog, setDialog]     = useState(false);
  const [submitting, setSubmit] = useState(false);
  const [updId, setUpdId]       = useState<string | null>(null);
  const loadCtrlRef = useRef<AbortController | null>(null);
  const loadSeqRef = useRef(0);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewForm>({
    defaultValues: { scheduled_time: defaultDateTime() },
  });

  const load = useCallback(async () => {
    loadCtrlRef.current?.abort();
    const ctrl = new AbortController();
    loadCtrlRef.current = ctrl;
    const seq = ++loadSeqRef.current;
    setLoading(true); setError(null);
    try {
      const data = await consultasApi.list(undefined, { signal: ctrl.signal });
      if (seq !== loadSeqRef.current || ctrl.signal.aborted) return;
      setItems(data);
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(getApiErrorMessage(e));
    } finally {
      if (seq === loadSeqRef.current && !ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => loadCtrlRef.current?.abort();
  }, [load]);

  const onSubmit = async (data: NewForm) => {
    if (submitting) return;
    setSubmit(true);
    try {
      const payload: CreateConsultaPayload = {
        patient_name:   data.patient_name.trim(),
        professional:   data.professional.trim(),
        room:           data.room.trim() || undefined,
        scheduled_time: new Date(data.scheduled_time).toISOString(),
        notes:          data.notes.trim() || undefined,
      };
      const created = await consultasApi.create(payload);
      setItems(prev => [created, ...prev]);
      setDialog(false);
      reset({ scheduled_time: defaultDateTime() });
      toast.success('Consulta criada!');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally { setSubmit(false); }
  };

  const updateEstado = async (id: string, estado: ConsultaStatus) => {
    if (updId) return;
    setUpdId(id);
    try {
      const updated = await consultasApi.updateEstado(id, estado);
      setItems(prev => prev.map(c => c.id === id ? updated : c));
      toast.success(`Status: ${STATUS_LABELS[estado]}`);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally { setUpdId(null); }
  };

  const cancel = async (id: string) => {
    if (!confirm('Cancelar esta consulta?')) return;
    setUpdId(id);
    try {
      await consultasApi.cancel(id);
      setItems(prev => prev.map(c => c.id === id ? { ...c, status: 'cancelled' as ConsultaStatus } : c));
      toast.success('Consulta cancelada');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally { setUpdId(null); }
  };

  const filtered = items.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.patient_name.toLowerCase().includes(q) || c.professional.toLowerCase().includes(q);
    const matchStatus = filter === 'all' || c.status === filter;
    return matchSearch && matchStatus;
  });

  return (
    <InstitutionLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Consultas</h1>
            <p className="text-gray-500 text-sm mt-0.5">Gerencie todas as consultas da clínica</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading} title="Recarregar">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={dialog} onOpenChange={setDialog}>
              <DialogTrigger asChild>
                <Button className="text-white">
                  <Plus className="w-4 h-4 mr-2" /> Nova Consulta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nova Consulta</DialogTitle>
                  <DialogDescription>Preencha os dados para agendar</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                  <div className="space-y-1">
                    <Label>Paciente *</Label>
                    <Input placeholder="Nome completo"
                      {...register('patient_name', { required: 'Obrigatório' })} />
                    {errors.patient_name && <p className="text-xs text-red-600">{errors.patient_name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Profissional *</Label>
                    <Input placeholder="Dr. Nome Sobrenome"
                      {...register('professional', { required: 'Obrigatório' })} />
                    {errors.professional && <p className="text-xs text-red-600">{errors.professional.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Sala</Label>
                      <Input placeholder="Consultório 1" {...register('room')} />
                    </div>
                    <div className="space-y-1">
                      <Label>Data e Hora *</Label>
                      <Input type="datetime-local"
                        {...register('scheduled_time', { required: 'Obrigatório' })} />
                      {errors.scheduled_time && <p className="text-xs text-red-600">{errors.scheduled_time.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Observações</Label>
                    <Input placeholder="Opcional" {...register('notes')} />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button type="button" variant="outline" className="flex-1"
                      onClick={() => setDialog(false)} disabled={submitting}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1 text-white"
 disabled={submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agendar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-4">
          <div className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar paciente ou profissional..."
                className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filter} onValueChange={v => setFilter(v as ConsultaStatus | 'all')}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {(Object.entries(STATUS_LABELS) as [ConsultaStatus, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Tabela */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /><span>Carregando...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-red-500 gap-2">
              <AlertCircle className="w-4 h-4" /><span>{error}</span>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nenhuma consulta encontrada"
              description={search || filter !== 'all'
                ? 'Tente ajustar os filtros'
                : 'Clique em "Nova Consulta" para começar'}
              actionLabel={!search && filter === 'all' ? 'Criar Consulta' : undefined}
              onAction={!search && filter === 'all' ? () => setDialog(true) : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="hidden lg:table-cell">Profissional</TableHead>
                    <TableHead className="hidden md:table-cell">Sala</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => {
                    const busy = updId === c.id;
                    const next = TRANSITIONS[c.status];
                    return (
                      <TableRow key={c.id} className={busy ? 'opacity-50' : ''}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {fmtTime(c.scheduled_time)}
                          </div>
                          <div className="text-xs text-gray-400">{fmtDate(c.scheduled_time)}</div>
                          {c.delay_minutes > 0 && <span className="text-xs text-orange-500">+{c.delay_minutes}min</span>}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm text-gray-900">{c.patient_name}</div>
                          <div className="text-xs text-gray-400 lg:hidden">{c.professional}</div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-gray-600">{c.professional}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-500">{c.room || '—'}</TableCell>
                        <TableCell><StatusBadge status={c.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {busy ? (
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            ) : (
                              <>
                                {next.length > 0 && (
                                  <Select onValueChange={v => updateEstado(c.id, v as ConsultaStatus)}>
                                    <SelectTrigger className="h-8 w-36 text-xs">
                                      <SelectValue placeholder="Atualizar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {next.map(s => (
                                        <SelectItem key={s} value={s} className="text-xs">
                                          → {STATUS_LABELS[s]}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                                {!['finished','cancelled'].includes(c.status) && (
                                  <Button variant="ghost" size="sm"
                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => cancel(c.id)} title="Cancelar">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {!loading && !error && (
          <p className="text-xs text-gray-400 mt-2 text-right">
            {filtered.length} consulta{filtered.length !== 1 ? 's' : ''}
            {items.length !== filtered.length ? ` (de ${items.length})` : ''}
          </p>
        )}
      </div>
    </InstitutionLayout>
  );
}
