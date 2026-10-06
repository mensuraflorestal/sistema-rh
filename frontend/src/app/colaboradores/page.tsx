'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { ColaboradorResumo, Estatisticas, RespostaColaboradoresPaginada } from '@/types/colaborador';
import { Search, Users, UserCheck, UserX, AlertCircle, Plus, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import Link from 'next/link';

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<ColaboradorResumo[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('ATIVO');
  const [unidadeFiltro, setUnidadeFiltro] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados de paginação
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistos, setTotalRegistos] = useState(0);
  const limite = 15;

  // Carrega estatísticas globais dos cards (apenas na montagem)
  useEffect(() => {
    async function carregarEstatisticas() {
      try {
        const res = await api.get<Estatisticas>('/api/colaboradores/estatisticas');
        setEstatisticas(res.data);
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    }
    carregarEstatisticas();
  }, []);

  // Busca dados paginados sempre que a página ou filtros mudarem
  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      try {
        const res = await api.get<RespostaColaboradoresPaginada>('/api/colaboradores', {
          params: {
            busca: busca || undefined,
            status: statusFiltro || undefined,
            unidade: unidadeFiltro || undefined,
            pagina: pagina,
            limite: limite,
          },
        });
        setColaboradores(res.data.itens);
        setTotalPaginas(res.data.total_paginas);
        setTotalRegistos(res.data.total);
      } catch (error) {
        console.error('Erro ao buscar colaboradores:', error);
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(carregarDados, 300);
    return () => clearTimeout(timeout);
  }, [busca, statusFiltro, unidadeFiltro, pagina]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Quadro de Colaboradores</h1>
            <p className="text-slate-500 text-sm">Gestão operacional de contratos e registos</p>
          </div>
          <Link
            href="/colaboradores/novo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Colaborador
          </Link>

          <Link
            href="/parametros"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Parâmetros</span>
          </Link>

          <button
            onClick={() => {
              localStorage.removeItem('rh_token');
              localStorage.removeItem('rh_user');
              document.cookie = 'rh_token=; path=/; max-age=0';
              window.location.href = '/login';
            }}
            className="px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold"
          >
            Sair
          </button>
        </div>

        {/* Cards de Contadores */}
        {estatisticas && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ativos</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{estatisticas.ativos}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Afastados</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{estatisticas.afastados}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inativos (Demitidos)</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">{estatisticas.inativos}</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
                <UserX className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Histórico</p>
                <p className="text-2xl font-bold text-slate-700 mt-1">{estatisticas.total}</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, função ou registro..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="flex w-full md:w-auto gap-3">
            <select
              value={unidadeFiltro}
              onChange={(e) => {
                setUnidadeFiltro(e.target.value);
                setPagina(1);
              }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Todas as Unidades</option>
              <option value="MATRIZ RS">Matriz RS</option>
              <option value="FILIAL MS">Filial MS</option>
              <option value="FILIAL RS">Filial RS</option>
            </select>
            <select
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value);
                setPagina(1);
              }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="ATIVO">Apenas Ativos</option>
              <option value="AFASTADO">Afastados</option>
              <option value="INATIVO">Inativos</option>
              <option value="TODOS">Todos os Status</option>
            </select>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-semibold">Cód / Reg</th>
                  <th className="px-6 py-3 font-semibold">Colaborador</th>
                  <th className="px-6 py-3 font-semibold">Função</th>
                  <th className="px-6 py-3 font-semibold">Unidade / Depto</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      A carregar colaboradores...
                    </td>
                  </tr>
                ) : colaboradores.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Nenhum colaborador encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  colaboradores.map((colab) => (
                    <tr key={colab.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {colab.registro || '-'}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {colab.nome}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {colab.funcao || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {colab.matriz_filial || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colab.status === 'ATIVO'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : colab.status === 'AFASTADO'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                        >
                          {colab.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/colaboradores/${colab.id}`}
                          className="text-emerald-600 hover:text-emerald-800 font-medium text-xs"
                        >
                          Visualizar
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Rodapé de Paginação */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              A mostrar{' '}
              <span className="font-semibold text-slate-700">
                {totalRegistos === 0 ? 0 : (pagina - 1) * limite + 1}
              </span>{' '}
              a{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(pagina * limite, totalRegistos)}
              </span>{' '}
              de <span className="font-semibold text-slate-700">{totalRegistos}</span> registos
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                disabled={pagina <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 bg-white text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <span className="text-xs font-medium text-slate-600 px-2">
                Página {pagina} de {totalPaginas}
              </span>

              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
                disabled={pagina >= totalPaginas || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 bg-white text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}