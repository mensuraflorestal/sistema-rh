import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Colaborador } from '@/types/colaborador';

/**
 * Dados financeiros ficam em colaboradores/{id}/privado/financeiro, uma subcoleção
 * com regras próprias (somente admin e rh_gestor). Assim, o leitor não recebe esses
 * campos nem pelo console, pois as regras do Firestore valem por documento.
 */
export const CAMPOS_FINANCEIROS = [
  'salario',
  'banco',
  'agencia',
  'numero_conta',
  'tipo_conta',
  'chave_pix',
] as const;

export type CampoFinanceiro = (typeof CAMPOS_FINANCEIROS)[number];
export type DadosFinanceiros = Partial<Pick<Colaborador, CampoFinanceiro>>;

const TAMANHO_LOTE_LEITURA = 25;

function referencia(idColaborador: string) {
  return doc(db, 'colaboradores', idColaborador, 'privado', 'financeiro');
}

/** Separa os campos financeiros do restante do cadastro. */
export function separarFinanceiro<T extends Partial<Colaborador>>(
  dados: T
): { publico: Omit<T, CampoFinanceiro>; financeiro: DadosFinanceiros } {
  const publico: Record<string, unknown> = { ...dados };
  const financeiro: Record<string, unknown> = {};

  for (const campo of CAMPOS_FINANCEIROS) {
    if (campo in publico) {
      if (publico[campo] !== undefined) financeiro[campo] = publico[campo];
      delete publico[campo];
    }
  }

  return {
    publico: publico as Omit<T, CampoFinanceiro>,
    financeiro: financeiro as DadosFinanceiros,
  };
}

export async function obterFinanceiro(idColaborador: string): Promise<DadosFinanceiros> {
  const snap = await getDoc(referencia(String(idColaborador)));
  return snap.exists() ? (snap.data() as DadosFinanceiros) : {};
}

/** Busca vários de uma vez (usado na exportação). Lê em blocos para não abrir centenas de requisições juntas. */
export async function obterFinanceiroEmLote(
  ids: Array<string | number>
): Promise<Map<string, DadosFinanceiros>> {
  const resultado = new Map<string, DadosFinanceiros>();
  const lista = ids.map(String);

  for (let i = 0; i < lista.length; i += TAMANHO_LOTE_LEITURA) {
    const bloco = lista.slice(i, i + TAMANHO_LOTE_LEITURA);
    const dados = await Promise.all(bloco.map((id) => obterFinanceiro(id)));
    bloco.forEach((id, idx) => resultado.set(id, dados[idx]));
  }

  return resultado;
}

/** Grava só os campos informados (merge); campos ausentes permanecem como estão. */
export async function salvarFinanceiro(
  idColaborador: string,
  dados: DadosFinanceiros
): Promise<void> {
  if (Object.keys(dados).length === 0) return;
  await setDoc(referencia(String(idColaborador)), dados, { merge: true });
}

