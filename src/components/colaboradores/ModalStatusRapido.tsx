'use client';

import { useState, useEffect } from 'react';
import { Colaborador } from '@/types/colaborador';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { X, AlertTriangle } from 'lucide-react';
import { STATUS_COLABORADOR, normalizarStatus, type StatusColaborador } from '@/lib/colaborador';

interface ModalStatusRapidoProps {
  aberto: boolean;
  colaborador: Colaborador | null;
  aoFechar: () => void;
  aoConfirmar: (dadosAtualizados: Partial<Colaborador>) => Promise<void>;
}

export function ModalStatusRapido({
  aberto,
  colaborador,
  aoFechar,
  aoConfirmar,
}: ModalStatusRapidoProps) {
  const [novoStatus, setNovoStatus] = useState<StatusColaborador>('INATIVO');
  const [dataDemissao, setDataDemissao] = useState<string>('');
  const [motivoDemissao, setMotivoDemissao] = useState<string>('SEM JUSTA CAUSA');
  const [salvando, setSalvando] = useState(false);

  // Inicializa a data no momento da montagem/abertura no cliente
  useEffect(() => {
    if (aberto && colaborador) {
      setDataDemissao(new Date().toISOString().split('T')[0]);
      setNovoStatus(normalizarStatus(colaborador.status));
      setMotivoDemissao('SEM JUSTA CAUSA');
    }
  }, [aberto, colaborador]);

  if (!aberto || !colaborador) return null;

  const isDesligamento = novoStatus === 'INATIVO';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);

    try {
      const payload: Partial<Colaborador> = {
        status: novoStatus,
      };

      if (isDesligamento) {
        payload.data_demissao = dataDemissao;
        payload.motivo_demissao = motivoDemissao;
      } else if (novoStatus === 'ATIVO') {
        // Ao reativar, limpa a demissão
        payload.data_demissao = null;
        payload.motivo_demissao = null;
      }

      await aoConfirmar(payload);
      aoFechar();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-60 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Alterar Situação do Colaborador
              </h2>
              <p className="text-xs text-slate-500">
                {colaborador.nome}
              </p>
            </div>
          </div>
          <button
            onClick={aoFechar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm text-slate-700">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Nova Situação *
            </label>
            <select
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value as StatusColaborador)}
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {STATUS_COLABORADOR.map((status) => (
                <option key={status} value={status}>
                  {status === 'ATIVO' && 'ATIVO (Em atividade normal)'}
                  {status === 'INATIVO' && 'INATIVO (Desligamento / Demissão)'}
                  {status === 'FÉRIAS' && 'FÉRIAS'}
                  {status === 'AFASTADO' && 'AFASTADO (INSS / Licença)'}
                </option>
              ))}
            </select>
          </div>

          {isDesligamento && (
            <div className="space-y-3 p-3 bg-red-50/60 rounded-xl border border-red-100">
              <Input
                label="Data do Desligamento *"
                type="date"
                value={dataDemissao}
                onChange={(e) => setDataDemissao(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">
                  Motivo da Demissão *
                </label>
                <select
                  value={motivoDemissao}
                  onChange={(e) => setMotivoDemissao(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="SEM JUSTA CAUSA">Dispensa sem justa causa</option>
                  <option value="COM JUSTA CAUSA">Dispensa com justa causa</option>
                  <option value="PEDIDO DE DEMISSAO">Pedido de demissão</option>
                  <option value="TERMINO DE CONTRATO">Término de contrato de experiência / prazo determinado</option>
                  <option value="ACORDO MUTUO">Acordo mútuo (Art. 484-A CLT)</option>
                  <option value="OUTRO">Outro / Não especificado</option>
                </select>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button type="button" variante="secondary" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              carregando={salvando}
              className={isDesligamento ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              Confirmar Alteração
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}