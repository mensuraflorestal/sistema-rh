'use client';

import { useState, useEffect } from 'react';
import { Colaborador } from '@/types/colaborador';
import { StatusBadge } from './StatusBadge';
import {
  X,
  Briefcase,
  User,
  FileText,
  MapPin,
  CreditCard,
  ShieldCheck,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ModalColaboradorProps {
  colaborador: Colaborador | null;
  aoFechar: () => void;
  aoEditar?: (colaborador: Colaborador) => void;
  aoMudarStatus?: (colaborador: Colaborador) => void;
}

function fmtData(data?: string | null) {
  if (!data) return '-';
  const limpa = data.split('T')[0];
  const [a, m, d] = limpa.split('-');
  return a && m && d ? `${d}/${m}/${a}` : data;
}

function fmtCPF(cpf?: string) {
  if (!cpf) return '-';
  const c = cpf.replace(/\D/g, '');
  return c.length === 11 ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf;
}

type Aba = 'contrato' | 'pessoal' | 'documentos' | 'endereco' | 'banco' | 'saude_epis';

export function ModalColaborador({ colaborador, aoFechar, aoEditar, aoMudarStatus }: ModalColaboradorProps) {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('contrato');


  const { temPermissao } = useAuth();
  const podeVerSalario = temPermissao(['admin', 'rh_gestor']);
  const podeEditar = temPermissao(['admin', 'rh_gestor']);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') aoFechar();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aoFechar]);

  if (!colaborador) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={aoFechar}
    >
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                Reg: {colaborador.registro || 'S/N'}
              </span>
              <StatusBadge status={colaborador.status} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {colaborador.nome}
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              {colaborador.funcao || 'Função não especificada'}
            </p>
          </div>

          <button
            onClick={aoFechar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Abas */}
        <div className="flex border-b border-slate-200 bg-white px-4 overflow-x-auto text-xs font-medium text-slate-600 gap-1">
          {[
            { id: 'contrato', rotulo: 'Contrato', icone: Briefcase },
            { id: 'pessoal', rotulo: 'Pessoal', icone: User },
            { id: 'documentos', rotulo: 'Documentos', icone: FileText },
            { id: 'endereco', rotulo: 'Endereço & Contato', icone: MapPin },
            { id: 'banco', rotulo: 'Bancário', icone: CreditCard },
            { id: 'saude_epis', rotulo: 'Saúde & EPIs', icone: ShieldCheck },
          ].map(({ id, rotulo, icone: Icone }) => (
            <button
              key={id}
              onClick={() => setAbaAtiva(id as Aba)}
              className={`flex items-center gap-1.5 py-3 px-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${abaAtiva === id
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
            >
              <Icone className="w-3.5 h-3.5" />
              {rotulo}
            </button>
          ))}
        </div>

        {/* Conteúdo da Aba Ativa */}
        <div className="p-6 flex-1 overflow-y-auto text-sm text-slate-700 space-y-4">
          {abaAtiva === 'contrato' && (
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">Unidade / Filial</span>
                <span className="font-medium text-slate-900">{colaborador.matriz_filial || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Grupo Operacional</span>
                <span className="font-medium text-slate-900">{colaborador.grupo || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Equipe</span>
                <span className="font-medium text-slate-900">{colaborador.equipe || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">CBO</span>
                <span className="font-medium text-slate-900 font-mono">{colaborador.cbo || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Admissão</span>
                <span className="font-medium text-slate-900">{fmtData(colaborador.data_admissao)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Demissão</span>
                <span className="font-medium text-slate-900">{fmtData(colaborador.data_demissao)}</span>
              </div>
              {colaborador.motivo_demissao && (
                <div className="col-span-2">
                  <span className="text-xs text-slate-500 block">Motivo Demissão</span>
                  <span className="font-medium text-slate-900">{colaborador.motivo_demissao}</span>
                </div>
              )}
              <div>
                <span className="text-xs text-slate-500 block">Fim Exp. 1 (45d)</span>
                <span className="font-medium text-slate-900">{fmtData(colaborador.fim_experiencia_1)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Fim Exp. 2 (90d)</span>
                <span className="font-medium text-slate-900">{fmtData(colaborador.fim_experiencia_2)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Jornada</span>
                <span className="font-medium text-slate-900">{colaborador.jornada || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">Remuneração Base</span>
                {podeVerSalario ? (
                  <span className="text-sm font-semibold text-emerald-700">
                    {colaborador.salario
                      ? colaborador.salario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : '-'}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Restrito à gestão
                  </span>
                )}
              </div>
            </div>
          )}

          {abaAtiva === 'pessoal' && (
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">Nascimento</span>
                <span className="font-medium text-slate-900">{fmtData(colaborador.data_nascimento)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Sexo / Gênero</span>
                <span className="font-medium text-slate-900">{colaborador.sexo || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Estado Civil</span>
                <span className="font-medium text-slate-900">{colaborador.estado_civil || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Raça / Cor</span>
                <span className="font-medium text-slate-900">{colaborador.raca_cor || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Grau de Instrução</span>
                <span className="font-medium text-slate-900">{colaborador.grau_instrucao || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Nacionalidade</span>
                <span className="font-medium text-slate-900">{colaborador.nacionalidade || 'Brasileira'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-500 block">Naturalidade</span>
                <span className="font-medium text-slate-900">
                  {colaborador.naturalidade ? `${colaborador.naturalidade} - ${colaborador.uf_naturalidade || ''}` : '-'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-500 block">Nome da Mãe</span>
                <span className="font-medium text-slate-900">{colaborador.nome_mae || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-500 block">Nome do Pai</span>
                <span className="font-medium text-slate-900">{colaborador.nome_pai || '-'}</span>
              </div>
            </div>
          )}

          {abaAtiva === 'documentos' && (
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">CPF</span>
                <span className="font-medium text-slate-900 font-mono">{fmtCPF(colaborador.cpf)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">PIS / PASEP</span>
                <span className="font-medium text-slate-900 font-mono">{colaborador.pis || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">RG</span>
                <span className="font-medium text-slate-900 font-mono">
                  {colaborador.rg ? `${colaborador.rg} ${colaborador.orgao_rg || ''} / ${colaborador.uf_rg || ''}` : '-'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Expedição RG</span>
                <span className="font-medium text-slate-900">{fmtData(colaborador.expedicao_rg)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">CTPS / Série</span>
                <span className="font-medium text-slate-900">
                  {colaborador.ctps_numero ? `${colaborador.ctps_numero} - ${colaborador.ctps_serie || ''} (${colaborador.uf_ctps || ''})` : '-'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">CNH / Categoria</span>
                <span className="font-medium text-slate-900">
                  {colaborador.cnh ? `${colaborador.cnh} (Cat. ${colaborador.categoria_cnh || '-'})` : 'Não possui'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Título de Eleitor</span>
                <span className="font-medium text-slate-900">{colaborador.titulo_eleitor || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Zona / Seção</span>
                <span className="font-medium text-slate-900">
                  {colaborador.zona_titulo ? `Zona: ${colaborador.zona_titulo} | Seç: ${colaborador.secao_titulo || ''}` : '-'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-500 block">Certificado de Reservista</span>
                <span className="font-medium text-slate-900">{colaborador.reservista || '-'}</span>
              </div>
            </div>
          )}

          {abaAtiva === 'endereco' && (
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <span className="text-xs text-slate-500 block">Endereço</span>
                  <span className="font-medium text-slate-900">{colaborador.endereco || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Número</span>
                  <span className="font-medium text-slate-900">{colaborador.numero || 'S/N'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">Complemento</span>
                  <span className="font-medium text-slate-900">{colaborador.complemento || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Bairro</span>
                  <span className="font-medium text-slate-900">{colaborador.bairro || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Cidade / UF</span>
                  <span className="font-medium text-slate-900">
                    {colaborador.cidade ? `${colaborador.cidade} - ${colaborador.uf_endereco || ''}` : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">CEP</span>
                  <span className="font-medium text-slate-900 font-mono">{colaborador.cep || '-'}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">Celular / WhatsApp</span>
                  <span className="font-medium text-slate-900">{colaborador.celular || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Telefone Fixo</span>
                  <span className="font-medium text-slate-900">{colaborador.telefone || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-500 block">E-mail</span>
                  <span className="font-medium text-slate-900">{colaborador.email || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {abaAtiva === 'banco' && (
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">Instituição Bancária</span>
                <span className="font-medium text-slate-900">{colaborador.banco || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Tipo de Conta</span>
                <span className="font-medium text-slate-900">{colaborador.tipo_conta || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Agência</span>
                <span className="font-medium text-slate-900 font-mono">{colaborador.agencia || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Número da Conta</span>
                <span className="font-medium text-slate-900 font-mono">{colaborador.numero_conta || '-'}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-500 block">Chave PIX</span>
                <span className="font-medium text-emerald-700 font-mono text-xs break-all">
                  {colaborador.chave_pix || '-'}
                </span>
              </div>
            </div>
          )}

          {abaAtiva === 'saude_epis' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">Tipo Sanguíneo</span>
                  <span className="font-bold text-red-700">{colaborador.tipo_sanguineo || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Alergias</span>
                  <span className="font-medium text-slate-900">{colaborador.alergia || 'Nenhuma informada'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-500 block">PCD / Deficiência</span>
                  <span className="font-medium text-slate-900">
                    {colaborador.possui_deficiencia ? `Sim: ${colaborador.descricao_deficiencia || 'Não especificada'}` : 'Não'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Tamanhos de Uniforme & EPIs
                </h4>
                <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <div>
                    <span className="text-xs text-slate-500 block">Camiseta</span>
                    <span className="font-bold text-slate-800 text-base">{colaborador.camiseta || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Calça</span>
                    <span className="font-bold text-slate-800 text-base">{colaborador.calca || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Sapato</span>
                    <span className="font-bold text-slate-800 text-base">{colaborador.sapato || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Jaqueta</span>
                    <span className="font-bold text-slate-800 text-base">{colaborador.jaqueta || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {podeEditar && (
              <>
                {aoMudarStatus && (
                  <button
                    onClick={() => aoMudarStatus(colaborador)}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 cursor-pointer"
                  >
                    Alterar Situação
                  </button>
                )}
                {aoEditar && (
                  <button
                    onClick={() => aoEditar(colaborador)}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  >
                    Editar Cadastro
                  </button>
                )}
              </>
            )}
          </div>

          <button
            onClick={aoFechar}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}