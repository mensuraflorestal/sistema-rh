'use client';

import { useState, useEffect } from 'react';
import { Colaborador } from '@/types/colaborador';
import { Cargo } from '@/types/cargo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { X, Briefcase, User, FileText, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { listarCargos } from '@/services/cargosService';
import {
  STATUS_COLABORADOR,
  cpfValido,
  formatarCpf,
  normalizarStatus,
} from '@/lib/colaborador';
import { ErroCadastroColaborador } from '@/services/colaboradoresService';
import { obterParametros, Parametros } from '@/services/parametrosService';
import { useAuth } from '@/contexts/AuthContext';

const classeSelect =
  'h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed';

interface FormProps {
  aberto: boolean;
  colaboradorParaEditar?: Colaborador | null;
  aoFechar: () => void;
  aoSalvar: (dados: Colaborador) => void | Promise<void>;
}

type AbaForm = 'contrato' | 'pessoal' | 'documentos' | 'endereco' | 'banco' | 'saude_epis';

export function FormColaboradorModal({
  aberto,
  colaboradorParaEditar,
  aoFechar,
  aoSalvar,
}: FormProps) {
  const [salvando, setSalvando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<AbaForm>('contrato');
  const [form, setForm] = useState<Partial<Colaborador>>({});
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [erro, setErro] = useState('');
  const [parametros, setParametros] = useState<Parametros>({ filiais: [], grupos: [], equipas: [] });

  const { temPermissao } = useAuth();
  const podeVerSalario = temPermissao(['admin', 'rh_gestor']);
  const podeEditar = temPermissao(['admin', 'rh_gestor']);

  useEffect(() => {
    if (!aberto) return;
    setErro('');
    setAbaAtiva('contrato');

    if (colaboradorParaEditar) {
      setForm({
        ...colaboradorParaEditar,
        status: normalizarStatus(colaboradorParaEditar.status),
        cpf: formatarCpf(colaboradorParaEditar.cpf),
      });
    } else {
      setForm({
        nome: '',
        cpf: '',
        status: 'ATIVO',
        data_admissao: new Date().toISOString().split('T')[0],
      });
    }

    let cancelado = false;
    listarCargos()
      .then((lista) => {
        if (cancelado) return;
        setCargos(lista);
        if (!colaboradorParaEditar?.funcao || colaboradorParaEditar.cargo_id) return;
        const correspondente = lista.find(
          (c) => c.nome.trim().toLowerCase() === colaboradorParaEditar.funcao?.trim().toLowerCase()
        );
        if (!correspondente) return;
        setForm((prev) =>
          prev.cargo_id ? prev : { ...prev, cargo_id: String(correspondente.id) }
        );
      })
      .catch((err) => {
        console.error('Erro ao carregar cargos:', err);
      });

    obterParametros().then((dados) => {
      if (!cancelado) setParametros(dados);
    }).catch(console.error);

    return () => {
      cancelado = true;
    };
  }, [colaboradorParaEditar, aberto]);

  if (!aberto) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEditar) return;
    setErro('');

    if (!form.nome?.trim()) {
      setErro('Informe o nome completo.');
      setAbaAtiva('contrato');
      return;
    }
    if (!cpfValido(form.cpf)) {
      setErro('Informe um CPF com 11 dígitos.');
      setAbaAtiva('contrato');
      return;
    }

    setSalvando(true);
    try {
      await aoSalvar({
        ...(form as Colaborador),
        nome: form.nome.trim(),
        cpf: formatarCpf(form.cpf),
        status: normalizarStatus(form.status),
      });
    } catch (err) {
      const mensagem =
        err instanceof ErroCadastroColaborador
          ? err.message
          : 'Não foi possível salvar o colaborador.';
      setErro(mensagem);
      setAbaAtiva('contrato');
    } finally {
      setSalvando(false);
    }
  }

  function setCampo(chave: keyof Colaborador, valor: Colaborador[keyof Colaborador]) {
    setForm((prev) => ({ ...prev, [chave]: valor }));
  }

  function aplicarCargo(cargoId: string) {
    if (!cargoId) {
      setForm((prev) => ({ ...prev, cargo_id: '' }));
      return;
    }
    const cargo = cargos.find((c) => String(c.id) === cargoId);
    if (!cargo) return;
    setForm((prev) => ({
      ...prev,
      cargo_id: String(cargo.id),
      funcao: cargo.nome,
      cbo: cargo.cbo || prev.cbo,
      jornada: cargo.jornada || prev.jornada,
      salario: podeVerSalario ? (cargo.salario_base ?? prev.salario) : prev.salario,
    }));
  }

  const cargoVinculado = Boolean(form.cargo_id);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in">
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {colaboradorParaEditar
                ? podeEditar
                  ? 'Editar Colaborador'
                  : 'Ficha do Colaborador (Consulta)'
                : 'Novo Colaborador'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão cadastral integral | RS Florestal
            </p>
          </div>
          <button
            onClick={aoFechar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-200 bg-white px-4 overflow-x-auto text-xs font-medium text-slate-600 gap-1">
          {[
            { id: 'contrato', rotulo: 'Contrato', icone: Briefcase },
            { id: 'pessoal', rotulo: 'Pessoal', icone: User },
            { id: 'documentos', rotulo: 'Documentos', icone: FileText },
            { id: 'endereco', rotulo: 'Endereço', icone: MapPin },
            { id: 'banco', rotulo: 'Bancário', icone: CreditCard },
            { id: 'saude_epis', rotulo: 'Saúde & EPIs', icone: ShieldCheck },
          ].map(({ id, rotulo, icone: Icone }) => (
            <button
              type="button"
              key={id}
              onClick={() => setAbaAtiva(id as AbaForm)}
              className={`flex items-center gap-1.5 py-3 px-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${abaAtiva === id
                  ? 'border-emerald-600 text-emerald-700 font-semibold'
                  : 'border-transparent hover:text-slate-900'
                }`}
            >
              <Icone className="w-3.5 h-3.5" />
              {rotulo}
            </button>
          ))}
        </div>

        {/* Formulário com restrição nos inputs caso seja apenas leitor */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {erro && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {erro}
            </div>
          )}

          <fieldset disabled={!podeEditar} className="contents">
            {abaAtiva === 'contrato' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nome Completo *"
                  value={form.nome || ''}
                  onChange={(e) => setCampo('nome', e.target.value)}
                  required
                />
                <Input
                  label="CPF *"
                  value={form.cpf || ''}
                  onChange={(e) => setCampo('cpf', formatarCpf(e.target.value))}
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  required
                />
                <Input
                  label="Matrícula / Registro"
                  value={form.registro || ''}
                  onChange={(e) => setCampo('registro', e.target.value)}
                />
                <div className="flex flex-col gap-1 w-full">
                  <label className="text-sm font-medium text-slate-700">Cargo da tabela</label>
                  <select
                    value={form.cargo_id || ''}
                    onChange={(e) => aplicarCargo(e.target.value)}
                    className={classeSelect}
                  >
                    <option value="">Sem cargo vinculado</option>
                    {cargos.map((cargo) => (
                      <option key={cargo.id} value={String(cargo.id)}>
                        {cargo.nome}
                        {cargo.cbo ? ` · CBO ${cargo.cbo}` : ''}
                      </option>
                    ))}
                  </select>
                  {cargos.length === 0 && (
                    <span className="text-xs text-slate-500">
                      Cadastre cargos em Estrutura de Cargos para preenchimento automático.
                    </span>
                  )}
                </div>
                <Input
                  label="Função / Cargo"
                  value={form.funcao || ''}
                  onChange={(e) => setCampo('funcao', e.target.value)}
                  disabled={cargoVinculado || !podeEditar}
                />
                <Input
                  label="CBO"
                  value={form.cbo || ''}
                  onChange={(e) => setCampo('cbo', e.target.value)}
                  disabled={cargoVinculado || !podeEditar}
                />

                <div className="flex flex-col gap-1 w-full">
                  <label className="text-sm font-medium text-slate-700">Unidade / Filial</label>
                  <select
                    value={form.matriz_filial || ''}
                    onChange={(e) => setCampo('matriz_filial', e.target.value)}
                    className={classeSelect}
                  >
                    <option value="">Selecione a filial...</option>
                    {parametros.filiais.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                    {form.matriz_filial && !parametros.filiais.includes(form.matriz_filial) && (
                      <option value={form.matriz_filial}>{form.matriz_filial} (Legado)</option>
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-1 w-full">
                  <label className="text-sm font-medium text-slate-700">Grupo Operacional</label>
                  <select
                    value={form.grupo || ''}
                    onChange={(e) => setCampo('grupo', e.target.value)}
                    className={classeSelect}
                  >
                    <option value="">Selecione o grupo...</option>
                    {parametros.grupos.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                    {form.grupo && !parametros.grupos.includes(form.grupo) && (
                      <option value={form.grupo}>{form.grupo} (Legado)</option>
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-1 w-full">
                  <label className="text-sm font-medium text-slate-700">Equipe</label>
                  <select
                    value={form.equipe || ''}
                    onChange={(e) => setCampo('equipe', e.target.value)}
                    className={classeSelect}
                  >
                    <option value="">Selecione a equipe...</option>
                    {parametros.equipas.map((eq) => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                    {form.equipe && !parametros.equipas.includes(form.equipe) && (
                      <option value={form.equipe}>{form.equipe} (Legado)</option>
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-1 w-full">
                  <label className="text-sm font-medium text-slate-700">Situação / Status</label>
                  <select
                    value={normalizarStatus(form.status)}
                    onChange={(e) => setCampo('status', e.target.value as Colaborador['status'])}
                    className={classeSelect}
                  >
                    {STATUS_COLABORADOR.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {podeVerSalario ? (
                  <Input
                    label="Salário Base (R$)"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={form.salario ?? ''}
                    onChange={(e) =>
                      setCampo('salario', e.target.value ? Number(e.target.value) : undefined)
                    }
                    disabled={!podeEditar}
                  />
                ) : (
                  <div className="flex flex-col justify-center p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Salário Base
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5">
                      Informação restrita à gestão de RH.
                    </span>
                  </div>
                )}

                <Input
                  label="Data Admissão"
                  type="date"
                  value={form.data_admissao || ''}
                  onChange={(e) => setCampo('data_admissao', e.target.value)}
                />
                <Input
                  label="Data Demissão"
                  type="date"
                  value={form.data_demissao || ''}
                  onChange={(e) => setCampo('data_demissao', e.target.value)}
                />
                <Input
                  label="Motivo Demissão"
                  value={form.motivo_demissao || ''}
                  onChange={(e) => setCampo('motivo_demissao', e.target.value)}
                />
                <Input
                  label="Fim Experiência 1"
                  type="date"
                  value={form.fim_experiencia_1 || ''}
                  onChange={(e) => setCampo('fim_experiencia_1', e.target.value)}
                />
                <Input
                  label="Fim Experiência 2"
                  type="date"
                  value={form.fim_experiencia_2 || ''}
                  onChange={(e) => setCampo('fim_experiencia_2', e.target.value)}
                />
                <Input
                  label="Jornada de Trabalho"
                  value={form.jornada || ''}
                  onChange={(e) => setCampo('jornada', e.target.value)}
                />
              </div>
            )}

            {abaAtiva === 'pessoal' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Data de Nascimento"
                  type="date"
                  value={form.data_nascimento || ''}
                  onChange={(e) => setCampo('data_nascimento', e.target.value)}
                />
                <Input
                  label="Sexo / Gênero"
                  value={form.sexo || ''}
                  onChange={(e) => setCampo('sexo', e.target.value)}
                />
                <Input
                  label="Estado Civil"
                  value={form.estado_civil || ''}
                  onChange={(e) => setCampo('estado_civil', e.target.value)}
                />
                <Input
                  label="Raça / Cor"
                  value={form.raca_cor || ''}
                  onChange={(e) => setCampo('raca_cor', e.target.value)}
                />
                <Input
                  label="Grau de Instrução"
                  value={form.grau_instrucao || ''}
                  onChange={(e) => setCampo('grau_instrucao', e.target.value)}
                />
                <Input
                  label="Nacionalidade"
                  value={form.nacionalidade || 'Brasileira'}
                  onChange={(e) => setCampo('nacionalidade', e.target.value)}
                />
                <Input
                  label="Naturalidade (Cidade)"
                  value={form.naturalidade || ''}
                  onChange={(e) => setCampo('naturalidade', e.target.value)}
                />
                <Input
                  label="UF Naturalidade"
                  maxLength={2}
                  value={form.uf_naturalidade || ''}
                  onChange={(e) => setCampo('uf_naturalidade', e.target.value.toUpperCase())}
                />
                <Input
                  label="Nome da Mãe"
                  value={form.nome_mae || ''}
                  onChange={(e) => setCampo('nome_mae', e.target.value)}
                  className="sm:col-span-2"
                />
                <Input
                  label="Nome do Pai"
                  value={form.nome_pai || ''}
                  onChange={(e) => setCampo('nome_pai', e.target.value)}
                  className="sm:col-span-2"
                />
              </div>
            )}

            {abaAtiva === 'documentos' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="CPF *"
                  value={form.cpf || ''}
                  onChange={(e) => setCampo('cpf', formatarCpf(e.target.value))}
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                />
                <Input
                  label="PIS / PASEP"
                  value={form.pis || ''}
                  onChange={(e) => setCampo('pis', e.target.value)}
                />
                <Input
                  label="RG"
                  value={form.rg || ''}
                  onChange={(e) => setCampo('rg', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Órgão RG"
                    value={form.orgao_rg || ''}
                    onChange={(e) => setCampo('orgao_rg', e.target.value)}
                  />
                  <Input
                    label="UF RG"
                    maxLength={2}
                    value={form.uf_rg || ''}
                    onChange={(e) => setCampo('uf_rg', e.target.value.toUpperCase())}
                  />
                </div>
                <Input
                  label="Expedição RG"
                  type="date"
                  value={form.expedicao_rg || ''}
                  onChange={(e) => setCampo('expedicao_rg', e.target.value)}
                />
                <Input
                  label="CTPS Número / Série"
                  value={form.ctps_numero || ''}
                  onChange={(e) => setCampo('ctps_numero', e.target.value)}
                />
                <Input
                  label="CNH"
                  value={form.cnh || ''}
                  onChange={(e) => setCampo('cnh', e.target.value)}
                />
                <Input
                  label="Categoria CNH"
                  value={form.categoria_cnh || ''}
                  onChange={(e) => setCampo('categoria_cnh', e.target.value)}
                />
                <Input
                  label="Título de Eleitor"
                  value={form.titulo_eleitor || ''}
                  onChange={(e) => setCampo('titulo_eleitor', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Zona"
                    value={form.zona_titulo || ''}
                    onChange={(e) => setCampo('zona_titulo', e.target.value)}
                  />
                  <Input
                    label="Seção"
                    value={form.secao_titulo || ''}
                    onChange={(e) => setCampo('secao_titulo', e.target.value)}
                  />
                </div>
                <Input
                  label="Certificado Reservista"
                  value={form.reservista || ''}
                  onChange={(e) => setCampo('reservista', e.target.value)}
                />
              </div>
            )}

            {abaAtiva === 'endereco' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="CEP"
                  value={form.cep || ''}
                  onChange={(e) => setCampo('cep', e.target.value)}
                />
                <Input
                  label="Logradouro / Endereço"
                  value={form.endereco || ''}
                  onChange={(e) => setCampo('endereco', e.target.value)}
                />
                <Input
                  label="Número"
                  value={form.numero || ''}
                  onChange={(e) => setCampo('numero', e.target.value)}
                />
                <Input
                  label="Complemento"
                  value={form.complemento || ''}
                  onChange={(e) => setCampo('complemento', e.target.value)}
                />
                <Input
                  label="Bairro"
                  value={form.bairro || ''}
                  onChange={(e) => setCampo('bairro', e.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input
                      label="Cidade"
                      value={form.cidade || ''}
                      onChange={(e) => setCampo('cidade', e.target.value)}
                    />
                  </div>
                  <Input
                    label="UF"
                    maxLength={2}
                    value={form.uf_endereco || ''}
                    onChange={(e) => setCampo('uf_endereco', e.target.value.toUpperCase())}
                  />
                </div>
                <Input
                  label="Celular / WhatsApp"
                  value={form.celular || ''}
                  onChange={(e) => setCampo('celular', e.target.value)}
                />
                <Input
                  label="Telefone Fixo"
                  value={form.telefone || ''}
                  onChange={(e) => setCampo('telefone', e.target.value)}
                />
                <Input
                  label="E-mail"
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setCampo('email', e.target.value)}
                  className="sm:col-span-2"
                />
              </div>
            )}

            {abaAtiva === 'banco' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Banco"
                  value={form.banco || ''}
                  onChange={(e) => setCampo('banco', e.target.value)}
                />
                <Input
                  label="Tipo de Conta"
                  placeholder="Ex: Corrente, Poupança, Salário"
                  value={form.tipo_conta || ''}
                  onChange={(e) => setCampo('tipo_conta', e.target.value)}
                />
                <Input
                  label="Agência"
                  value={form.agencia || ''}
                  onChange={(e) => setCampo('agencia', e.target.value)}
                />
                <Input
                  label="Número da Conta"
                  value={form.numero_conta || ''}
                  onChange={(e) => setCampo('numero_conta', e.target.value)}
                />
                <Input
                  label="Chave PIX"
                  value={form.chave_pix || ''}
                  onChange={(e) => setCampo('chave_pix', e.target.value)}
                  className="sm:col-span-2"
                />
              </div>
            )}

            {abaAtiva === 'saude_epis' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Tipo Sanguíneo"
                    placeholder="Ex: A+, O+, B-"
                    value={form.tipo_sanguineo || ''}
                    onChange={(e) => setCampo('tipo_sanguineo', e.target.value)}
                  />
                  <Input
                    label="Alergias Conhecidas"
                    value={form.alergia || ''}
                    onChange={(e) => setCampo('alergia', e.target.value)}
                  />
                  <Input
                    label="Descrição Deficiência (se houver)"
                    value={form.descricao_deficiencia || ''}
                    onChange={(e) => setCampo('descricao_deficiencia', e.target.value)}
                    className="sm:col-span-2"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Tamanhos de Uniforme / EPI
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Input
                      label="Camiseta"
                      placeholder="M, G, GG..."
                      value={form.camiseta || ''}
                      onChange={(e) => setCampo('camiseta', e.target.value)}
                    />
                    <Input
                      label="Calça"
                      placeholder="40, 42..."
                      value={form.calca || ''}
                      onChange={(e) => setCampo('calca', e.target.value)}
                    />
                    <Input
                      label="Sapato / Bota"
                      placeholder="41, 42..."
                      value={form.sapato || ''}
                      onChange={(e) => setCampo('sapato', e.target.value)}
                    />
                    <Input
                      label="Jaqueta"
                      placeholder="M, G..."
                      value={form.jaqueta || ''}
                      onChange={(e) => setCampo('jaqueta', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </fieldset>

          {/* Rodapé com botões de ação */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <Button type="button" variante="secondary" onClick={aoFechar}>
              {podeEditar ? 'Cancelar' : 'Fechar'}
            </Button>
            {podeEditar && (
              <Button type="submit" carregando={salvando} className="bg-emerald-600 hover:bg-emerald-700">
                Salvar Registro
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}