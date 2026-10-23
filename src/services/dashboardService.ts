import { listarColaboradores } from './colaboradoresService';

export interface MetricasDashboard {
    totalColaboradores: number;
    ativos: number;
    inativos: number;
}

/**
 * Calcula as métricas respeitando o escopo de filiais do usuário
 * (reaproveita o cache e as consultas filtradas de colaboradoresService).
 */
export async function carregarMetricas(
    filiaisPermitidas: string[] = [],
    podeVerTodas = false
): Promise<MetricasDashboard> {
    const lista = await listarColaboradores(false, filiaisPermitidas, podeVerTodas);
    let ativos = 0;
    let inativos = 0;

    lista.forEach((c) => {
        if (c.status === 'INATIVO') {
            inativos++;
        } else if (c.status === 'ATIVO') {
            ativos++;
        }
    });

    return {
        totalColaboradores: lista.length,
        ativos,
        inativos,
    };
}