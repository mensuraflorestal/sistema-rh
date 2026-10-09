import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { normalizarStatus } from '@/lib/colaborador';

export interface MetricasDashboard {
    totalColaboradores: number;
    ativos: number;
    inativos: number;
}

export async function carregarMetricas(): Promise<MetricasDashboard> {
    const snapshot = await getDocs(collection(db, 'colaboradores'));
    let ativos = 0;
    let inativos = 0;

    snapshot.forEach((doc) => {
        const status = normalizarStatus(String(doc.data().status || ''));
        if (status === 'INATIVO') {
            inativos++;
        } else if (status === 'ATIVO') {
            ativos++;
        }
    });

    return {
        totalColaboradores: snapshot.size,
        ativos,
        inativos,
    };
}