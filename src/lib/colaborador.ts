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
  const clean = normalizarCpf(cpf);
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(clean.charAt(i), 10) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(clean.charAt(i), 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(clean.charAt(10), 10);
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
