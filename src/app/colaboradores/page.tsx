'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { monitorarSessao } from '@/services/authService';
import { listarColaboradores } from '@/services/colaboradoresService';
import { Colaborador } from '@/types/colaborador';
import { normalizarStatus } from '@/lib/colaborador';
import { Navbar } from '@/components/layout/Navbar';
import { FiltrosColaboradores } from '@/components/colaboradores/FiltrosColaboradores';
import { TabelaColaboradores } from '@/components/colaboradores/TabelaColaboradores';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ModalColaborador } from '@/components/colaboradores/ModalColaborador';
import { salvarColaborador } from '@/services/colaboradoresService';
import { FormColaboradorModal } from '@/components/colaboradores/FormColaboradorModal';
import { UserPlus } from 'lucide-react';
import { exportarColaboradoresXLSX } from '@/services/excelService';
import { ModalStatusRapido } from '@/components/colaboradores/ModalStatusRapido';
import { RefreshCw } from 'lucide-react';

const ITENS_POR_PAGINA = 15;

export default function ColaboradoresPage() {
    const router = useRouter();
    const [todos, setTodos] = useState<Colaborador[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('TODOS');
    const [pagina, setPagina] = useState(1);
    const [formAberto, setFormAberto] = useState(false);
    const [colaboradorEditando, setColaboradorEditando] = useState<Colaborador | null>(null);
    const [sincronizando, setSincronizando] = useState(false);
    const [ultimaSinc, setUltimaSinc] = useState<string>('');


    async function sincronizarDados(mostrarLoading = false) {
        if (mostrarLoading) setSincronizando(true);
        try {
            const dados = await listarColaboradores(true); // Força busca remota limpa
            setTodos(dados);
            const agora = new Date();
            setUltimaSinc(agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        } catch (err) {
            console.error('Erro na sincronização periódica:', err);
        } finally {
            if (mostrarLoading) setSincronizando(false);
        }
    }

    useEffect(() => {
        const INTERVALO_MS = 15 * 60 * 1000; // 15 minutos

        const intervalo = setInterval(() => {
            // Só consome leitura se o usuário estiver de fato com a aba aberta e ativa
            if (document.visibilityState === 'visible') {
                sincronizarDados(false);
            }
        }, INTERVALO_MS);

        // Define o horário inicial assim que monta
        const agora = new Date();
        setUltimaSinc(agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

        return () => clearInterval(intervalo);
    }, []);

    async function lidarComSalvar(dados: Colaborador) {
        const salvo = await salvarColaborador(dados);

        // Atualização em memória imediata
        setTodos((atuais) => {
            const idx = atuais.findIndex((c) => String(c.id) === String(salvo.id));
            if (idx >= 0) {
                const copia = [...atuais];
                copia[idx] = salvo;
                return copia;
            }
            return [salvo, ...atuais];
        });

        // Atualiza o colaborador selecionado na ficha, se estiver aberta
        if (colaboradorSelecionado && String(colaboradorSelecionado.id) === String(salvo.id)) {
            setColaboradorSelecionado(salvo);
        }

        setFormAberto(false);
        setColaboradorEditando(null);
    }

    useEffect(() => {
        const unsubscribe = monitorarSessao(async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                const dados = await listarColaboradores();
                setTodos(dados);
            } catch (err) {
                console.error('Erro ao listar colaboradores:', err);
            } finally {
                setCarregando(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Filtragem instantânea sem consumo de leituras no Firestore
    const filtrados = useMemo(() => {
        return todos.filter((c) => {
            const matchStatus =
                filtroStatus === 'TODOS' || normalizarStatus(c.status) === filtroStatus;
            const termo = busca.toLowerCase();
            const matchBusca =
                !termo ||
                c.nome.toLowerCase().includes(termo) ||
                c.cpf?.includes(termo) ||
                c.registro?.toLowerCase().includes(termo);

            return matchStatus && matchBusca;
        });
    }, [todos, busca, filtroStatus]);

    const [colabMudarStatus, setColabMudarStatus] = useState<Colaborador | null>(null);

    async function lidarComAlteracaoStatus(dadosAtualizados: Partial<Colaborador>) {
        if (!colabMudarStatus) return;

        const atualizado = await salvarColaborador({
            id: colabMudarStatus.id,
            ...dadosAtualizados,
        });

        // Atualiza a lista na memória mantendo todos os campos
        setTodos((atuais) =>
            atuais.map((c) => (String(c.id) === String(atualizado.id) ? atualizado : c))
        );

        // Atualiza o colaborador selecionado no drawer
        if (colaboradorSelecionado && String(colaboradorSelecionado.id) === String(atualizado.id)) {
            setColaboradorSelecionado(atualizado);
        }

        setColabMudarStatus(null);
    }

    // Redefine para a página 1 ao pesquisar
    useEffect(() => {
        setPagina(1);
    }, [busca, filtroStatus]);

    // Paginação em memória
    const totalPaginas = Math.ceil(filtrados.length / ITENS_POR_PAGINA);
    const itensExibidos = useMemo(() => {
        const inicio = (pagina - 1) * ITENS_POR_PAGINA;
        return filtrados.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [filtrados, pagina]);
    const [colaboradorSelecionado, setColaboradorSelecionado] = useState<Colaborador | null>(null);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Colaboradores</h1>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span>{filtrados.length} registros</span>
                            <span>•</span>
                            <span>Atualizado às {ultimaSinc || '--:--'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variante="secondary"
                            onClick={() => sincronizarDados(true)}
                            disabled={sincronizando}
                            className="gap-2 text-xs h-9 border border-slate-200 text-slate-600 hover:text-slate-900"
                            title="Atualizar dados agora"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${sincronizando ? 'animate-spin text-emerald-600' : ''}`} />
                            <span>{sincronizando ? 'Atualizando...' : 'Sincronizar'}</span>
                        </Button>

                        <Button
                            onClick={() => {
                                setColaboradorEditando(null);
                                setFormAberto(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 text-xs"
                        >
                            <UserPlus className="w-4 h-4" />
                            Novo Colaborador
                        </Button>
                    </div>
                </div>

                <FiltrosColaboradores
                    busca={busca}
                    onBuscaChange={setBusca}
                    status={filtroStatus}
                    onStatusChange={setFiltroStatus}
                    totalFiltrados={filtrados.length}
                    aoExportarExcel={() => exportarColaboradoresXLSX(filtrados, 'relatorio_rs_florestal')}
                />

                {carregando ? (
                    <div className="py-20 flex justify-center">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* 1. AQUI: Adicionar o aoSelecionar */}
                        <TabelaColaboradores
                            colaboradores={itensExibidos}
                            aoSelecionar={(colab) => setColaboradorSelecionado(colab)}
                        />

                        {/* Paginação */}
                        {totalPaginas > 1 && (
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-sm text-slate-500">
                                    Página {pagina} de {totalPaginas}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variante="secondary"
                                        disabled={pagina === 1}
                                        onClick={() => setPagina((p) => p - 1)}
                                        className="h-9 px-3"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variante="secondary"
                                        disabled={pagina === totalPaginas}
                                        onClick={() => setPagina((p) => p + 1)}
                                        className="h-9 px-3"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>


            <ModalColaborador
                colaborador={colaboradorSelecionado}
                aoFechar={() => setColaboradorSelecionado(null)}
                aoEditar={(colab) => {
                    setColaboradorEditando(colab);
                    setFormAberto(true);
                }}
                aoMudarStatus={(colab) => setColabMudarStatus(colab)}
            />

            <FormColaboradorModal
                aberto={formAberto}
                colaboradorParaEditar={colaboradorEditando}
                aoFechar={() => {
                    setFormAberto(false);
                    setColaboradorEditando(null);
                }}
                aoSalvar={lidarComSalvar}
            />

            <ModalStatusRapido
                aberto={Boolean(colabMudarStatus)}
                colaborador={colabMudarStatus}
                aoFechar={() => setColabMudarStatus(null)}
                aoConfirmar={lidarComAlteracaoStatus}
            />

        </div>
    );
}