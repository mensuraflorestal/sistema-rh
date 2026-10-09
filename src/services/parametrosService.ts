import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface Parametros {
  filiais: string[];
  grupos: string[];
  equipas: string[];
}

const parametrosPadrao: Parametros = {
  filiais: [],
  grupos: [],
  equipas: [],
};

let cacheParametros: Parametros | null = null;

export async function obterParametros(forcarAtualizacao = false): Promise<Parametros> {
  if (cacheParametros && !forcarAtualizacao) {
    return cacheParametros;
  }

  const docRef = doc(db, 'configuracoes', 'parametros_rh');
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    cacheParametros = { ...parametrosPadrao, ...snapshot.data() } as Parametros;
  } else {
    cacheParametros = parametrosPadrao;
  }

  return cacheParametros;
}

export async function salvarParametros(novosDados: Parametros): Promise<Parametros> {
  const docRef = doc(db, 'configuracoes', 'parametros_rh');
  
  // Limpa arrays vazios e ordena alfabeticamente para a interface ficar bonita
  const formatado: Parametros = {
    filiais: novosDados.filiais.filter(Boolean).sort(),
    grupos: novosDados.grupos.filter(Boolean).sort(),
    equipas: novosDados.equipas.filter(Boolean).sort(),
  };

  await setDoc(docRef, formatado, { merge: true });
  cacheParametros = formatado;
  
  return formatado;
}