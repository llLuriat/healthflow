import { Badge } from './ui/badge';

const CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  scheduled:     { label: 'Agendado',        color: 'var(--hf-status-scheduled)',    bg: 'var(--hf-status-scheduled-bg)' },
  delayed:       { label: 'Atrasado',        color: 'var(--hf-status-delayed)',      bg: 'var(--hf-status-delayed-bg)' },
  'in-progress': { label: 'Em Atendimento',  color: 'var(--hf-status-in-progress)', bg: 'var(--hf-status-in-progress-bg)' },
  finished:      { label: 'Finalizado',      color: 'var(--hf-status-finished)',     bg: 'var(--hf-status-finished-bg)' },
  cancelled:     { label: 'Cancelado',       color: '#6B7280',                       bg: '#F3F4F6' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status] ?? { label: status, color: '#6B7280', bg: '#F3F4F6' };
  return (
    <Badge variant="secondary" className="font-medium"
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: 'none' }}>
      {cfg.label}
    </Badge>
  );
}
