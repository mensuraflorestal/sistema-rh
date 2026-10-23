import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteField,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { Colaborador } from '@/types/colaborador';
import {
  cpfValido,
  formatarCpf,
  normalizarCpf,
  normalizarStatus,
} from '@/lib/colaborador';
import { salvarFinanceiro, separarFinanceiro } from './financeiroService';

let cacheColaboradores: Colaborador[] | null = null;
let ultimaSincronizacao: Date | null = null;

// Limite do operador 'in' do Firestore (v9) por consulta
const LIMITE_IN_FIRESTORE = 10;

export interface EscopoFiliais {
  filiaisPermitidas: string[];
  podeVerTodas: boolean;
  /** admin e rh_gestor: pode gravar salário e dados bancários */
  podeVerFinanceiro?: boolean;
}

export class ErroCadastroColaborador extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErroCadastroColaborador';
  }
}

export function obterUltimaSincronizacao(): Date | null {
  return ultimaSincronizacao;
}

/** Deve ser chamado no logout/troca de usuário para não vazar dados entre sessões. */
export function limparCacheColaboradores(): void {
  cacheColaboradores = null;
  ultimaSincronizacao = null;
}

function ordenarPorNome(lista: Colaborador[]): void {
  lista.sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
}

function mapearColaborador(id: string, dados: Record<string, unknown>): Colaborador {
  // Descarta salário/dados bancários que ainda existam no documento principal (legado)
  const { publico } = separarFinanceiro(dados as Partial<Colaborador>);
  return {
    ...(publico as Omit<Colaborador, 'id' | 'status' | 'cpf'>),
    id,
    cpf: formatarCpf(String(dados.cpf || '')),
    status: normalizarStatus(String(dados.status || '')),
    cargo_id: dados.cargo_id ? String(dados.cargo_id) : undefined,
  };
}

export async function listarColaboradores(
  forcarAtualizacao = false,
  filiaisPermitidas: string[] = [],
  podeVerTodas = false
): Promise<Colaborador[]> {
  if (cacheColaboradores && !forcarAtualizacao) {
    return cacheColaboradores;
  }

  const colecaoRef = collection(db, 'colaboradores');
  const verTudo = podeVerTodas || filiaisPermitidas.includes('TODAS');
  let docs: QueryDocumentSnapshot<DocumentData>[];

  if (verTudo) {
    docs = (await getDocs(colecaoRef)).docs;
  } else if (filiaisPermitidas.length === 0) {
    // Sem filiais atribuídas: não vê nada (negação por padrão)
    docs = [];
  } else {
    const lotes: string[][] = [];
    for (let i = 0; i < filiaisPermitidas.length; i += LIMITE_IN_FIRESTORE) {
      lotes.push(filiaisPermitidas.slice(i, i + LIMITE_IN_FIRESTORE));
    }
    const snapshots = await Promise.all(
      lotes.map((lote) => getDocs(query(colecaoRef, where('matriz_filial', 'in', lote))))
    );
    docs = snapshots.flatMap((s) => s.docs);
  }

  const lista = docs.map((d) => mapearColaborador(d.id, d.data()));
  ordenarPorNome(lista);

  cacheColaboradores = lista;
  ultimaSincronizacao = new Date();
  return lista;
}

export async function salvarColaborador(
  dados: Partial<Colaborador> & { id?: string | number },
  escopo: EscopoFiliais = { filiaisPermitidas: [], podeVerTodas: false }
): Promise<Colaborador> {
  const idDocumento = dados.id ? String(dados.id) : doc(collection(db, 'colaboradores')).id;
  // Usa apenas o que o usuário pode ver (respeita o escopo de filiais)
  const lista = await listarColaboradores(false, escopo.filiaisPermitidas, escopo.podeVerTodas);
  const existente = lista.find((c) => String(c.id) === idDocumento) || ({} as Partial<Colaborador>);
  const isNovo = !existente.id;

  const cpfEntrada = dados.cpf !== undefined ? dados.cpf : existente.cpf;
  const cpfFinal = cpfValido(cpfEntrada) ? formatarCpf(cpfEntrada) : String(cpfEntrada || '');

  if (isNovo || dados.cpf !== undefined) {
    if (!cpfValido(cpfFinal)) {
      throw new ErroCadastroColaborador('Informe um CPF com 11 dígitos.');
    }
  }

  if (cpfValido(cpfFinal)) {
    const duplicado = lista.find(
      (c) => String(c.id) !== idDocumento && normalizarCpf(c.cpf) === normalizarCpf(cpfFinal)
    );
    if (duplicado) {
      throw new ErroCadastroColaborador(`CPF já cadastrado para ${duplicado.nome}.`);
    }
  }

  const colaboradorMesclado: Colaborador = {
    ...existente,
    ...dados,
    id: idDocumento,
    nome: dados.nome !== undefined ? dados.nome : existente.nome || '',
    cpf: cpfFinal,
    status: normalizarStatus(dados.status || existente.status || 'ATIVO'),
    cargo_id: (dados.cargo_id !== undefined ? dados.cargo_id : existente.cargo_id) || undefined,
  };

  // Campos financeiros (salário e dados bancários) nunca vão para o documento principal
  const { publico: colaboradorPublico } = separarFinanceiro(colaboradorMesclado);
  const { financeiro: dadosFinanceiros } = separarFinanceiro(dados);

  const dadosParaFirestore: Record<string, unknown> = Object.fromEntries(
    Object.entries(colaboradorPublico).filter(([, v]) => v !== undefined)
  );

  if (!colaboradorMesclado.cargo_id) {
    dadosParaFirestore.cargo_id = deleteField();
  }
  if (colaboradorMesclado.status === 'ATIVO') {
    dadosParaFirestore.data_demissao = deleteField();
    dadosParaFirestore.motivo_demissao = deleteField();
  }

  const docRef = doc(db, 'colaboradores', idDocumento);
  await setDoc(docRef, dadosParaFirestore, { merge: true });

  // Só quem pode ver o financeiro grava nele (o documento principal é gravado antes,
  // pois as regras da subcoleção consultam a filial do colaborador)
  if (escopo.podeVerFinanceiro) {
    await salvarFinanceiro(idDocumento, dadosFinanceiros);
  }

  // O retorno e o cache não carregam dados financeiros; a interface os busca sob demanda
  const resultado = colaboradorPublico as Colaborador;

  if (cacheColaboradores) {
    const index = cacheColaboradores.findIndex((c) => String(c.id) === idDocumento);
    if (index >= 0) {
      cacheColaboradores[index] = resultado;
    } else {
      cacheColaboradores.push(resultado);
    }
    // Garante ordem alfabética sem precisar bater no Firestore de novo
    ordenarPorNome(cacheColaboradores);
  }

  return resultado;
}