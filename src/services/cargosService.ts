import { db } from './firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { Cargo } from '@/types/cargo';

let cacheCargos: Cargo[] | null = null;

export async function listarCargos(forcarAtualizacao = false): Promise<Cargo[]> {
  if (cacheCargos && !forcarAtualizacao) {
    return cacheCargos;
  }

  const snapshot = await getDocs(collection(db, 'cargos'));
  const lista = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Cargo[];

  lista.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  cacheCargos = lista;
  return lista;
}

export async function salvarCargo(dados: Partial<Cargo> & { id?: string | number }): Promise<Cargo> {
  const idDoc = dados.id ? String(dados.id) : doc(collection(db, 'cargos')).id;

  const cargoCompleto: Cargo = {
    id: idDoc,
    nome: dados.nome || '',
    cbo: dados.cbo || '',
    salario_base: dados.salario_base,
    jornada: dados.jornada || '',
    descricao: dados.descricao || '',
  };

  // 1. Remove rigorosamente qualquer chave que tenha valor 'undefined'
  const dadosParaFirestore = Object.fromEntries(
    Object.entries(cargoCompleto).filter(([_, v]) => v !== undefined)
  );

  // 2. Grava no Firestore com merge ativo
  const docRef = doc(db, 'cargos', idDoc);
  await setDoc(docRef, dadosParaFirestore, { merge: true });

  // 3. Atualiza o cache local
  if (cacheCargos) {
    const idx = cacheCargos.findIndex((c) => String(c.id) === idDoc);
    if (idx >= 0) {
      cacheCargos[idx] = cargoCompleto;
    } else {
      cacheCargos.push(cargoCompleto);
    }
    cacheCargos.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }

  return cargoCompleto;
}