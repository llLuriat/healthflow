import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  Users as UsersIcon, Search, Mail, Phone, Edit, Trash2, Plus, Loader2, User, Activity
} from 'lucide-react';
import { toast }             from 'sonner';
import { Button }            from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input }             from '../components/ui/input';
import { Label }             from '../components/ui/label';
import { EmptyState }        from '../components/EmptyState';
import { InstitutionLayout } from '../layouts/InstitutionLayout';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '../components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { professionalsApi, Professional, CreateProfessionalPayload, getApiErrorMessage } from '../lib/api';

interface ProfessionalFormData {
  name:      string;
  specialty: string;
  email:     string;
  phone:     string;
  room:      string;
}

// ─── NavLinks definido FORA do componente para evitar recriação a cada render ─
export default function ProfissionaisPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [isDialogOpen, setIsDialogOpen]   = useState(false);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [deleteId, setDeleteId]           = useState<string | null>(null);
  const [editTarget, setEditTarget]       = useState<Professional | null>(null);
  const loadCtrlRef = useRef<AbortController | null>(null);
  const loadSeqRef = useRef(0);

  const { register, handleSubmit, formState: { errors }, reset, setValue } =
    useForm<ProfessionalFormData>();

  // ── Carregar profissionais da API ──────────────────────────────────────────
  const load = useCallback(async () => {
    loadCtrlRef.current?.abort();
    const ctrl = new AbortController();
    loadCtrlRef.current = ctrl;
    const seq = ++loadSeqRef.current;
    setLoading(true); setError(null);
    try {
      const data = await professionalsApi.list(false, { signal: ctrl.signal });
      if (seq !== loadSeqRef.current || ctrl.signal.aborted) return;
      setProfessionals(data);
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

  // ── Abrir dialog para editar ────────────────────────────────────────────────
  const openEdit = (p: Professional) => {
    setEditTarget(p);
    setValue('name',      p.name);
    setValue('specialty', p.specialty ?? '');
    setValue('email',     p.email ?? '');
    setValue('phone',     p.phone ?? '');
    setValue('room',      p.room ?? '');
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditTarget(null);
    reset();
    setIsDialogOpen(true);
  };

  // ── Submeter form (criar ou editar) ────────────────────────────────────────
  const onSubmit = async (data: ProfessionalFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload: CreateProfessionalPayload = {
        name:      data.name.trim(),
        specialty: data.specialty.trim() || undefined,
        email:     data.email.trim()     || undefined,
        phone:     data.phone.trim()     || undefined,
        room:      data.room.trim()      || undefined,
      };

      if (editTarget) {
        const updated = await professionalsApi.update(editTarget.id, payload);
        setProfessionals(prev => prev.map(p => p.id === updated.id ? updated : p));
        toast.success('Profissional atualizado!');
      } else {
        const created = await professionalsApi.create(payload);
        setProfessionals(prev => [created, ...prev]);
        toast.success('Profissional cadastrado!');
      }

      reset();
      setIsDialogOpen(false);
      setEditTarget(null);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Desativar profissional ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await professionalsApi.remove(deleteId);
      setProfessionals(prev => prev.filter(p => p.id !== deleteId));
      toast.success('Profissional desativado.');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setIsSubmitting(false);
      setDeleteId(null);
    }
  };

  const filtered = professionals.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.specialty ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <InstitutionLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Profissionais</h1>
            <p className="text-gray-600 text-sm">{professionals.length} profissional(is) cadastrado(s)</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(o) => { if (!o) { setEditTarget(null); reset(); } setIsDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button className="text-white" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" /> Novo Profissional
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editTarget ? 'Editar Profissional' : 'Novo Profissional'}</DialogTitle>
                <DialogDescription>Preencha os dados do profissional de saúde.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                <div className="space-y-1">
                  <Label>Nome completo *</Label>
                  <Input placeholder="Dr. Nome Sobrenome"
                    className={errors.name ? 'border-red-500' : ''}
                    {...register('name', { required: 'Nome é obrigatório' })} />
                  {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Especialidade</Label>
                  <Input placeholder="Ex: Cardiologia"
                    {...register('specialty')} />
                </div>
                <div className="space-y-1">
                  <Label>E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type="email" placeholder="profissional@clinica.com"
                      className="pl-9" {...register('email')} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="(11) 9 0000-0000"
                      className="pl-9" {...register('phone')} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Consultório / Sala</Label>
                  <Input placeholder="Ex: Consultório 1"
                    {...register('room')} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1"
                    onClick={() => { setIsDialogOpen(false); setEditTarget(null); reset(); }}
                    disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 text-white"
 disabled={isSubmitting}>
                    {isSubmitting
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                      : editTarget ? 'Salvar alterações' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Busca */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Buscar por nome ou especialidade..."
            className="pl-9" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        {/* Estados */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        )}
        {error && (
          <Card><CardContent className="p-8 text-center">
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>Tentar novamente</Button>
          </CardContent></Card>
        )}

        {/* Lista */}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={<UsersIcon className="w-10 h-10 text-gray-300" />}
            title="Nenhum profissional encontrado"
            description={searchQuery ? 'Tente outro termo de busca.' : 'Cadastre o primeiro profissional da sua equipe.'}
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{p.name}</h3>
                        {p.specialty && <p className="text-xs text-gray-500 mt-0.5">{p.specialty}</p>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                    {p.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate text-xs">{p.email}</span>
                      </div>
                    )}
                    {p.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-xs">{p.phone}</span>
                      </div>
                    )}
                    {p.room && (
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-xs">{p.room}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs"
                      onClick={() => openEdit(p)}>
                      <Edit className="w-3.5 h-3.5 mr-1.5" /> Editar
                    </Button>
                    <Button variant="outline" size="sm"
                      className="text-red-500 hover:text-red-600 hover:border-red-300 text-xs"
                      onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirm desativar */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar profissional?</AlertDialogTitle>
            <AlertDialogDescription>
              O profissional será marcado como inativo e não aparecerá mais na listagem padrão.
              Esta ação pode ser revertida pelo suporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white">
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </InstitutionLayout>
  );
}
