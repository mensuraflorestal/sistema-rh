export const STATUS_COLABORADOR = ['ATIVO', 'FÉRIAS', 'AFASTADO', 'INATIVO'] as const;

export type StatusColaborador = (typeof STATUS_COLABORADOR)[number];

export function normalizarCpf(cpf?: string | null): string {
  return (cpf || '').replace(/\D/g, '').slice(0, 11);
}

export function formatarCpf(cpf?: string | null): string {
  const digitos = normalizarCpf(cpf);
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  }
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

export function cpfValido(cpf?: string | null): boolean {
  return normalizarCpf(cpf).length === 11;
}

export function normalizarStatus(status?: string | null): StatusColaborador {
  const bruto = (status || '').toUpperCase().trim();
  const semAcento = bruto.normalize('NFD').replace(/\p{M}/gu, '');

  if (semAcento === 'INATIVO' || semAcento.includes('DEMIT') || semAcento.includes('DESLIG')) {
    return 'INATIVO';
  }
  if (semAcento.includes('FERIAS')) return 'FÉRIAS';
  if (semAcento.includes('AFAST') || semAcento.includes('LICEN')) return 'AFASTADO';
  return 'ATIVO';
}
