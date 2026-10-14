'use client';

import { useState, useMemo } from 'react';
import { Colaborador } from '@/types/colaborador';
import { StatusBadge } from './StatusBadge';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface TabelaProps {
  colaboradores: Colaborador[];
  aoSelecionar: (colaborador: Colaborador) => void;
}

type CampoOrdenacao = 'registro' | 'nome' | 'funcao' | 'matriz_filial' | 'status';
type DirecaoOrdenacao = 'asc' | 'desc';

export function TabelaColaboradores({ colaboradores, aoSelecionar }: TabelaProps) {
  const [colunaOrdenada, setColunaOrdenada] = useState<CampoOrdenacao | null>(null);
  const [direcao, setDirecao] = useState<DirecaoOrdenacao>('asc');

  function alternarOrdenacao(campo: CampoOrdenacao) {
    if (colunaOrdenada === campo) {
      if (direcao === 'asc') {
        setDirecao('desc');
      } else {
        // Terceiro clique reseta para a ordem natural
        setColunaOrdenada(null);
        setDirecao('asc');
      }
    } else {
      setColunaOrdenada(campo);
      setDirecao('asc');
    }
  }

  const colaboradoresOrdenados = useMemo(() => {
    if (!colunaOrdenada) return colaboradores;

    return [...colaboradores].sort((a, b) => {
      let valorA: string | number = '';
      let valorB: string | number = '';

      if (colunaOrdenada === 'registro') {
        const numA = Number(a.registro);
        const numB = Number(b.registro);
        // Se ambos forem números válidos, ordena numericamente (ex: 2 vem antes de 10)
        if (!isNaN(numA) && !isNaN(numB) && a.registro && b.registro) {
          return direcao === 'asc' ? numA - numB : numB - numA;
        }
        valorA = a.registro || '';
        valorB = b.registro || '';
      } else if (colunaOrdenada === 'nome') {
        valorA = a.nome || '';
        valorB = b.nome || '';
      } else if (colunaOrdenada === 'funcao') {
        valorA = a.funcao || '';
        valorB = b.funcao || '';
      } else if (colunaOrdenada === 'matriz_filial') {
        valorA = a.matriz_filial || '';
        valorB = b.matriz_filial || '';
      } else if (colunaOrdenada === 'status') {
        valorA = a.status || '';
        valorB = b.status || '';
      }

      const comparacao = String(valorA).localeCompare(String(valorB), 'pt-BR', {
        sensitivity: 'base',
        numeric: true,
      });

      return direcao === 'asc' ? comparacao : -comparacao;
    });
  }, [colaboradores, colunaOrdenada, direcao]);

  function renderIconeOrdenacao(campo: CampoOrdenacao) {
    if (colunaOrdenada !== campo) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return direcao === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
    );
  }

  if (colaboradores.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        Nenhum colaborador encontrado para os filtros selecionados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-600 select-none">
          <tr>
            <th
              onClick={() => alternarOrdenacao('registro')}
              className="px-4 py-3 cursor-pointer hover:bg-slate-100/70 transition-colors group"
            >
              <div className="flex items-center gap-1.5">
                <span>Reg.</span>
                {renderIconeOrdenacao('registro')}
              </div>
            </th>

            <th
              onClick={() => alternarOrdenacao('nome')}
              className="px-4 py-3 cursor-pointer hover:bg-slate-100/70 transition-colors group"
            >
              <div className="flex items-center gap-1.5">
                <span>Nome Completo</span>
                {renderIconeOrdenacao('nome')}
              </div>
            </th>

            <th
              onClick={() => alternarOrdenacao('funcao')}
              className="px-4 py-3 cursor-pointer hover:bg-slate-100/70 transition-colors group"
            >
              <div className="flex items-center gap-1.5">
                <span>Função</span>
                {renderIconeOrdenacao('funcao')}
              </div>
            </th>

            <th
              onClick={() => alternarOrdenacao('matriz_filial')}
              className="px-4 py-3 cursor-pointer hover:bg-slate-100/70 transition-colors group"
            >
              <div className="flex items-center gap-1.5">
                <span>Unidade</span>
                {renderIconeOrdenacao('matriz_filial')}
              </div>
            </th>

            <th
              onClick={() => alternarOrdenacao('status')}
              className="px-4 py-3 text-center cursor-pointer hover:bg-slate-100/70 transition-colors group"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span>Estado</span>
                {renderIconeOrdenacao('status')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {colaboradoresOrdenados.map((colab) => (
            <tr
              key={colab.id}
              onClick={() => aoSelecionar(colab)}
              className="hover:bg-emerald-50/40 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                {colab.registro || '-'}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">
                {colab.nome}
                <div className="text-xs text-slate-400 font-normal">{colab.cpf}</div>
              </td>
              <td className="px-4 py-3 text-slate-600">{colab.funcao || 'Não informada'}</td>
              <td className="px-4 py-3 text-slate-600">{colab.matriz_filial || '-'}</td>
              <td className="px-4 py-3 text-center">
                <StatusBadge status={colab.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}