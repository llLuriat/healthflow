import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Calendar, Clock, ChevronRight, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button }            from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { InstitutionLayout } from '../layouts/InstitutionLayout';
import { StatusBadge }       from '../components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { consultasApi, Consulta, getApiErrorMessage } from '../lib/api';

function todayISO() { return new Date().toISOString().split('T')[0]; }
function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}
function fmtDate() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function DashboardPage() {
  const [items, setItems]   = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const loadCtrlRef = useRef<AbortController | null>(null);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    loadCtrlRef.current?.abort();
    const ctrl = new AbortController();
    loadCtrlRef.current = ctrl;
    const seq = ++loadSeqRef.current;
    consultasApi.list(todayISO(), { signal: ctrl.signal })
      .then((data) => {
        if (seq !== loadSeqRef.current || ctrl.signal.aborted) return;
        setItems(data);
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        setError(getApiErrorMessage(e));
      })
      .finally(() => {
        if (seq === loadSeqRef.current && !ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, []);

  const total    = items.length;
  const finished = items.filter(c => c.status === 'finished').length;
  const delayed  = items.filter(c => c.status === 'delayed').length;
  const inProg   = items.filter(c => c.status === 'in-progress').length;
  const upcoming = items.filter(c => ['scheduled','delayed','in-progress'].includes(c.status)).slice(0, 5);

  return (
    <InstitutionLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-600 capitalize text-sm">{fmtDate()}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Consultas Hoje', value: total,    sub: 'Total agendado',   icon: Calendar, color: '' },
            { label: 'Finalizadas',    value: finished,  sub: total ? `${Math.round(finished/total*100)}% completo` : '—', icon: null, dot: 'bg-green-600' },
            { label: 'Em Andamento',   value: inProg,    sub: `${delayed} com atraso`, icon: null, dot: 'bg-blue-500' },
            { label: 'Atrasos',        value: delayed,   sub: delayed > 0 ? 'Requer atenção' : 'Tudo em dia', icon: Clock, color: '' },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{s.label}</span>
                  {s.icon && <s.icon className="w-4 h-4 text-gray-400" />}
                  {s.dot && <div className={`w-2 h-2 rounded-full ${s.dot}`} />}
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300" /> : s.value}
                </div>
                <div className={`text-xs mt-1 ${i === 1 ? 'text-green-600' : i === 3 && delayed > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
                  {!loading && s.sub}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Próximas consultas */}
        <Card className="mb-6">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Próximas Consultas</h2>
              <p className="text-xs text-gray-500 mt-0.5">Agendadas para hoje</p>
            </div>
            <Link to="/consultas">
              <Button size="sm" className="text-white w-full sm:w-auto"
>
                <Plus className="w-4 h-4 mr-1" /> Nova Consulta
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /><span>Carregando...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-red-500 gap-2">
                <AlertCircle className="w-4 h-4" /><span>{error}</span>
              </div>
            ) : upcoming.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma consulta agendada para hoje</p>
                <Link to="/consultas">
                  <Button variant="outline" size="sm" className="mt-3 text-xs">Criar consulta</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="hidden md:table-cell">Profissional</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcoming.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-sm">{fmtTime(c.scheduled_time)}</TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900 text-sm">{c.patient_name}</div>
                        <div className="text-xs text-gray-400 md:hidden">{c.professional}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-600">{c.professional}</TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                        {c.delay_minutes > 0 && <span className="text-xs text-orange-500 ml-1">+{c.delay_minutes}min</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {!loading && !error && (
            <div className="p-4 border-t border-gray-100">
              <Link to="/consultas">
                <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 text-sm">
                  Ver todas as consultas <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </InstitutionLayout>
  );
}
