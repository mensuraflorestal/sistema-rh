import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteField, 
  query, 
  where 
} from 'firebase/firestore';
import { Colaborador } from '@/types/colaborador';
import {
  cpfValido,
  formatarCpf,
  normalizarCpf,
  normalizarStatus,
} from '@/lib/colaborador';

let cacheColaboradores: Colaborador[] | null = null;
let ultimaSincronizacao: Date | null = null;

export class ErroCadastroColaborador extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErroCadastroColaborador';
  }
}

export function obterUltimaSincronizacao(): Date | null {
  return ultimaSincronizacao;
}

function mapearColaborador(id: string, dados: Record<string, unknown>): Colaborador {
  return {
    ...(dados as Omit<Colaborador, 'id' | 'status' | 'cpf'>),
    id,
    cpf: formatarCpf(String(dados.cpf || '')),
    status: normalizarStatus(String(dados.status || '')),
    cargo_id: dados.cargo_id ? String(dados.cargo_id) : undefined,
  };
}

export async function listarColaboradores(
  forcarAtualizacao = false,
  filiaisPermitidas: string[] = [],
  podeVerTodas = true
): Promise<Colaborador[]> {
  if (cacheColaboradores && !forcarAtualizacao) {
    return cacheColaboradores;
  }

  const colecaoRef = collection(db, 'colaboradores');
  let q;

  // Se o usuário puder ver todas ou tiver 'TODAS', consulta a coleção inteira
  if (podeVerTodas || filiaisPermitidas.includes('TODAS')) {
    q = colecaoRef;
  } else if (filiaisPermitidas.length > 0) {
    // Busca no Firestore apenas documentos onde matriz_filial esteja no array de permissões
    // O operador 'in' aceita até 30 valores no Firestore
    q = query(colecaoRef, where('matriz_filial', 'in', filiaisPermitidas));
  } else {
    // Sem filial permitida cadastrada: não consome leituras desnecessárias
    cacheColaboradores = [];
    ultimaSincronizacao = new Date();
    return [];
  }

  const snapshot = await getDocs(q);
  const lista = snapshot.docs.map((d) => mapearColaborador(d.id, d.data()));
  lista.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

  cacheColaboradores = lista;
  ultimaSincronizacao = new Date();
  return lista;
}

export async function salvarColaborador(dados: Partial<Colaborador> & { id?: string | number }): Promise<Colaborador> {
  const idDocumento = String(dados.id || Date.now());
  const lista = await listarColaboradores();
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

  const dadosParaFirestore: Record<string, unknown> = Object.fromEntries(
    Object.entries(colaboradorMesclado).filter(([_, v]) => v !== undefined)
  );

  if (!colaboradorMesclado.cargo_id) {
    dadosParaFirestore.cargo_id = deleteField();
  }

  const docRef = doc(db, 'colaboradores', idDocumento);
  await setDoc(docRef, dadosParaFirestore, { merge: true });

  if (cacheColaboradores) {
    const index = cacheColaboradores.findIndex((c) => String(c.id) === idDocumento);
    if (index >= 0) {
      cacheColaboradores[index] = colaboradorMesclado;
    } else {
      cacheColaboradores.unshift(colaboradorMesclado);
    }
  }

  return colaboradorMesclado;
}