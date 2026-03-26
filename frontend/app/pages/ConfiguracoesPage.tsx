import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Upload, Loader2 } from 'lucide-react';
import { toast }                from 'sonner';
import { Button }               from '../components/ui/button';
import { Card, CardContent }    from '../components/ui/card';
import { Input }                from '../components/ui/input';
import { Label }                from '../components/ui/label';
import { InstitutionLayout }    from '../layouts/InstitutionLayout';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { settingsApi, UpdateSettingsPayload, ClinicSettings, getApiErrorMessage } from '../lib/api';

interface FormData {
  clinicName:    string;
  email_contact: string;
  phone:         string;
  address:       string;
}

const SEGMENTS = [
  { value: 'medico',       label: 'Clínica Médica',  color: '#2563EB' },
  { value: 'dental',       label: 'Odontologia',     color: '#0EA5E9' },
  { value: 'veterinaria',  label: 'Veterinária',     color: '#059669' },
  { value: 'oftalmologia', label: 'Oftalmologia',    color: '#1E40AF' },
];

export default function ConfiguracoesPage() {
  const [segment, setSegment]         = useState('medico');
  const [isLoading, setIsLoading]     = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loadCtrlRef = useRef<AbortController | null>(null);
  const submitNonceRef = useRef(0);

  const currentSegment = SEGMENTS.find(s => s.value === segment);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  // Carrega configurações reais da API
  useEffect(() => {
    loadCtrlRef.current?.abort();
    const ctrl = new AbortController();
    loadCtrlRef.current = ctrl;

    settingsApi.get({ signal: ctrl.signal })
      .then((data: ClinicSettings) => {
        if (ctrl.signal.aborted) return;
        reset({
          clinicName:    data.name           ?? '',
          email_contact: data.email_contact  ?? '',
          phone:         data.phone          ?? '',
          address:       data.address        ?? '',
        });
        if (data.segment) setSegment(data.segment);
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        toast.error(getApiErrorMessage(err) || 'Não foi possível carregar as configurações.');
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });
    return () => ctrl.abort();
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;
    const nonce = ++submitNonceRef.current;
    setIsSubmitting(true);
    try {
      const payload: UpdateSettingsPayload = {
        name:          data.clinicName,
        segment:       segment || undefined,
        phone:         data.phone         || undefined,
        address:       data.address       || undefined,
        email_contact: data.email_contact || undefined,
        primary_color: currentSegment?.color,
      };
      await settingsApi.update(payload);
      if (nonce !== submitNonceRef.current) return;
      toast.success('Configurações salvas com sucesso!');
    } catch (err) {
      if (nonce !== submitNonceRef.current) return;
      toast.error(getApiErrorMessage(err) || 'Erro ao salvar configurações.');
    } finally {
      if (nonce === submitNonceRef.current) setIsSubmitting(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB.');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPG ou WebP.');
      return;
    }
    // Upload de logo requereria endpoint dedicado — placeholder informativo
    toast.info('Upload de logo: recurso disponível na versão Enterprise.');
  };

  return (
    <InstitutionLayout>
      <div className="p-4 lg:p-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Configurações</h1>
          <p className="text-gray-600 text-sm">Gerencie as informações e identidade visual da sua clínica</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações básicas */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-base font-semibold text-gray-900">Informações Básicas</h2>

                <div className="space-y-1">
                  <Label htmlFor="clinicName">Nome da Clínica *</Label>
                  <Input id="clinicName" disabled={isSubmitting}
                    className={errors.clinicName ? 'border-red-500' : ''}
                    {...register('clinicName', {
                      required: 'Nome da clínica é obrigatório',
                      minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                    })} />
                  {errors.clinicName && (
                    <p className="text-xs text-red-600" role="alert">{errors.clinicName.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email_contact">E-mail de Contato</Label>
                  <Input id="email_contact" type="email" disabled={isSubmitting}
                    className={errors.email_contact ? 'border-red-500' : ''}
                    {...register('email_contact', {
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'E-mail inválido' },
                    })} />
                  {errors.email_contact && (
                    <p className="text-xs text-red-600" role="alert">{errors.email_contact.message}</p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" disabled={isSubmitting} {...register('phone')} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="address">Endereço</Label>
                    <Input id="address" disabled={isSubmitting} {...register('address')} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Identidade visual */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-base font-semibold text-gray-900">Identidade Visual</h2>

                <div className="space-y-1">
                  <Label htmlFor="segment">Segmento</Label>
                  <Select value={segment} onValueChange={setSegment} disabled={isSubmitting}>
                    <SelectTrigger id="segment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENTS.map(seg => (
                        <SelectItem key={seg.value} value={seg.value}>
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full inline-block"
                              style={{ backgroundColor: seg.color }} />
                            {seg.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Cor Primária</Label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border-2 border-gray-200 shrink-0"
                      style={{ backgroundColor: currentSegment?.color }} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{currentSegment?.label}</p>
                      <p className="text-xs text-gray-500">{currentSegment?.color}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Logo da Clínica</Label>
                  <div className="flex items-center gap-3">
                    <input id="logo-upload" type="file" accept="image/png,image/jpeg,image/webp"
                      className="hidden" onChange={handleLogoUpload} disabled={isSubmitting} />
                    <Button type="button" variant="outline" size="sm"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      disabled={isSubmitting}>
                      <Upload className="w-4 h-4 mr-2" /> Fazer Upload
                    </Button>
                    <p className="text-xs text-gray-500">PNG, JPG ou WebP. Máx 2MB.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
                  : <><Save className="w-4 h-4" />Salvar Alterações</>}
              </Button>
            </div>
          </form>
        )}
      </div>
    </InstitutionLayout>
  );
}
