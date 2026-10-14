import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UsuarioSistema } from '@/types/usuario';

let usuarioCache: UsuarioSistema | null = null;

export async function loginComEmail(email: string, pass: string) {
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function logout() {
  usuarioCache = null;
  return await signOut(auth);
}

export async function obterPerfilAtual(user: User): Promise<UsuarioSistema | null> {
  if (usuarioCache && usuarioCache.uid === user.uid) {
    return usuarioCache;
  }

  const docRef = doc(db, 'usuarios', user.uid);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    const dados = snap.data();
    usuarioCache = {
      uid: user.uid,
      email: user.email || '',
      nome: dados.nome || user.email || '',
      role: dados.role || 'leitor',
      ativo: dados.ativo ?? true,
      filiais_permitidas: dados.filiais_permitidas || [],
    };
  } else {
    // Se o utilizador autenticado não tiver documento, assume papel restrito
    usuarioCache = {
      uid: user.uid,
      email: user.email || '',
      nome: user.email || '',
      role: 'leitor',
      ativo: true,
      filiais_permitidas: [],
    };
  }

  return usuarioCache;
}

export function monitorarSessaoComPerfil(
  callback: (user: User | null, perfil: UsuarioSistema | null) => void
) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      usuarioCache = null;
      callback(null, null);
      return;
    }

    try {
      const perfil = await obterPerfilAtual(user);
      callback(user, perfil);
    } catch (err) {
      console.error('Erro ao procurar perfil do utilizador:', err);
      callback(user, null);
    }
  });
}

export function monitorarSessao(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}