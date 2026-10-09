import { auth } from './firebase';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';

export async function loginComEmail(email: string, senha: string): Promise<User> {
    const credencial = await signInWithEmailAndPassword(auth, email, senha);
    return credencial.user;
}

export async function deslogar(): Promise<void> {
    await signOut(auth);
}

export function monitorarSessao(callback: (user: User | null) => void){
    return onAuthStateChanged(auth, callback);
}