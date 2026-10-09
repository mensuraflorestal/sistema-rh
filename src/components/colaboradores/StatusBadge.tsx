import { normalizarStatus, type StatusColaborador } from '@/lib/colaborador';

interface StatusBadgeProps {
  status?: string;
}

const estilos: Record<StatusColaborador, string> = {
  ATIVO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INATIVO: 'bg-slate-100 text-slate-600 border-slate-200',
  'FÉRIAS': 'bg-blue-50 text-blue-700 border-blue-200',
  AFASTADO: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function StatusBadge({ status = 'ATIVO' }: StatusBadgeProps) {
  const canonico = normalizarStatus(status);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${estilos[canonico]}`}
    >
      {canonico}
    </span>
  );
}
