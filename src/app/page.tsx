'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { listarColaboradores } from '@/services/colaboradoresService';
import { Colaborador } from '@/types/colaborador';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { 
  Users, UserCheck, UserX, ArrowRight, 
  CalendarClock, Gift 
} from 'lucide-react';
import Link from 'next/link';

interface AlertaExperiencia {
  colab: Colaborador;
  dataStr: string;
  tipo: string;
  dias: number;
}

interface AlertaAniversario {
  colab: Colaborador;
  dia: number;
}

export default function HomePage() {
  const router = useRouter();
  const { user, carregando: authCarregando, filiaisPermitidas, podeVerTodasFiliais } = useAuth();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(true);

  const [painel, setPainel] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
    expVencendo: [] as AlertaExperiencia[],
    aniversariantes: [] as AlertaAniversario[],
    nomeMesAtual: '',
  });

  // Proteção de rota centralizada via useAuth
  useEffect(() => {
    if (authCarregando) return;

    if (!user) {
      router.push('/login');
      return;
    }

    let cancelado = false;

    async function buscarDados() {
      try {
        const dados = await listarColaboradores(false, filiaisPermitidas, podeVerTodasFiliais);
        if (!cancelado) {
          setColaboradores(dados);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        if (!cancelado) {
          setCarregandoDados(false);
        }
      }
    }

    buscarDados();

    return () => {
      cancelado = true;
    };
  }, [user, authCarregando, router, filiaisPermitidas, podeVerTodasFiliais]);

  useEffect(() => {
    if (colaboradores.length === 0) return;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const limiteExp = new Date(hoje);
    limiteExp.setDate(limiteExp.getDate() + 15);

    const mesAtual = hoje.getMonth() + 1;
    const nomeMes = hoje.toLocaleString('pt-BR', { month: 'long' });
    const nomeMesFormatado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

    let ativos = 0;
    let inativos = 0;
    const expVencendo: AlertaExperiencia[] = [];
    const aniversariantes: AlertaAniversario[] = [];

    colaboradores.forEach((c) => {
      if (c.status === 'INATIVO') inativos++;
      else if (c.status === 'ATIVO') ativos++;

      if (c.status !== 'ATIVO') return;

      if (c.data_nascimento) {
        const partes = c.data_nascimento.split('-');
        if (partes.length === 3) {
          const [, mes, dia] = partes;
          if (parseInt(mes, 10) === mesAtual) {
            aniversariantes.push({ colab: c, dia: parseInt(dia, 10) });
          }
        }
      }

      const verificarExperiencia = (dataStr?: string | null, tipo?: string) => {
        if (!dataStr) return;
        const partes = dataStr.split('-');
        if (partes.length === 3) {
          const [a, m, d] = partes;
          const dataExp = new Date(Number(a), Number(m) - 1, Number(d));
          if (dataExp >= hoje && dataExp <= limiteExp) {
            const diffTime = dataExp.getTime() - hoje.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            expVencendo.push({ colab: c, dataStr, tipo: tipo || '', dias: diffDays });
          }
        }
      };

      verificarExperiencia(c.fim_experiencia_1, '1º Período (45d)');
      verificarExperiencia(c.fim_experiencia_2, '2º Período (90d)');
    });

    aniversariantes.sort((a, b) => a.dia - b.dia);
    expVencendo.sort((a, b) => a.dias - b.dias);

    setPainel({
      total: colaboradores.length,
      ativos,
      inativos,
      expVencendo,
      aniversariantes,
      nomeMesAtual: nomeMesFormatado,
    });
  }, [colaboradores]);

  function formatarDataBR(dataIso: string) {
    if (!dataIso) return '-';
    const partes = dataIso.split('-');
    if (partes.length === 3) {
      const [a, m, d] = partes;
      return `${d}/${m}/${a}`;
    }
    return dataIso;
  }

  if (authCarregando || (!user && !authCarregando) || (user && carregandoDados)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Painel Geral</h1>
          <p className="text-sm text-slate-500 mt-1">
            Visão consolidada do efetivo da RS Florestal
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="flex items-center gap-4 py-5">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Registrado</span>
              <span className="text-2xl font-bold text-slate-900 block mt-0.5">{painel.total}</span>
            </div>
          </Card>

          <Card className="flex items-center gap-4 py-5 border-l-4 border-l-emerald-500">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider block">Colaboradores Ativos</span>
              <span className="text-2xl font-bold text-slate-900 block mt-0.5">{painel.ativos}</span>
            </div>
          </Card>

          <Card className="flex items-center gap-4 py-5 border-l-4 border-l-amber-500">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-amber-700 uppercase tracking-wider block">Desligados / Inativos</span>
              <span className="text-2xl font-bold text-slate-900 block mt-0.5">{painel.inativos}</span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              Acesso Rápido
            </h2>

            <Link href="/colaboradores" className="group block">
              <Card className="hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between py-5">
                <div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">Gerenciar Colaboradores</h3>
                  <p className="text-xs text-slate-500 mt-1">Consultar fichas e exportar excel</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </Card>
            </Link>

            <Link href="/cargos" className="group block">
              <Card className="hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between py-5">
                <div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">Estrutura de Cargos</h3>
                  <p className="text-xs text-slate-500 mt-1">Tabela salarial e jornadas padrão</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </Card>
            </Link>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-amber-500" />
                  Vencimento de Experiência
                </h2>
                <Card className="flex-1 p-0 overflow-hidden">
                  <div className="p-4 bg-amber-50/50 border-b border-slate-100">
                    <p className="text-xs text-slate-600 font-medium">Contratos a vencer nos próximos 15 dias</p>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto p-2">
                    {painel.expVencendo.length === 0 ? (
                      <div className="py-6 text-center text-sm text-slate-400">Nenhum contrato a vencer em breve.</div>
                    ) : (
                      <div className="space-y-1">
                        {painel.expVencendo.map((alerta, idx) => (
                          <div key={idx} className="flex items-start justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{alerta.colab.nome}</p>
                              <p className="text-xs text-slate-500">{alerta.colab.funcao || 'Sem função'} • {alerta.tipo}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${alerta.dias <= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                                {alerta.dias === 0 ? 'Hoje!' : `Faltam ${alerta.dias} dias`}
                              </span>
                              <p className="text-[11px] text-slate-400 mt-1 font-mono">{formatarDataBR(alerta.dataStr)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-500" />
                  Aniversariantes de {painel.nomeMesAtual || '...'}
                </h2>
                <Card className="flex-1 p-0 overflow-hidden">
                  <div className="max-h-[330px] overflow-y-auto p-2">
                    {painel.aniversariantes.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-400">Nenhum aniversariante neste mês.</div>
                    ) : (
                      <div className="space-y-1">
                        {painel.aniversariantes.map((niver, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                            <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shadow-xs">
                              {niver.dia}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-bold text-slate-800 truncate">{niver.colab.nome}</p>
                              <p className="text-xs text-slate-500 truncate">{niver.colab.matriz_filial || 'RS Florestal'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}