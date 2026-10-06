'use client';

import { useState, useEffect } from 'react';
import { ColaboradorCompleto } from '@/types/colaborador';
import { api } from '@/services/api';
import {
  Briefcase,
  User,
  FileText,
  MapPin,
  CreditCard,
  ShieldAlert,
  Save,
  ArrowLeft,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors';
const selectClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors';

interface CargoItem {
  id: number;
  nome: string;
  cbo?: string | null;
  salario_base: number;
  jornada_padrao?: string | null;
}

interface Props {
  dadosIniciais?: Partial<ColaboradorCompleto>;
  aoSalvar: (dados: Partial<ColaboradorCompleto>) => Promise<void>;
  carregando: boolean;
}

// Utilitários de Máscaras
const formatarCPF = (v: string) => {
  return v
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const formatarCEP = (v: string) => {
  return v
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, '$1-$2');
};

const formatarTelefone = (v: string) => {
  const nums = v.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 10) {
    return nums.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return nums.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
};

export function FormularioColaborador({ dadosIniciais = {}, aoSalvar, carregando }: Props) {
  const [form, setForm] = useState<Partial<ColaboradorCompleto>>({
    status: 'ATIVO',
    nacionalidade: 'BRASILEIRA',
    possui_deficiencia: 'Não',
    ...dadosIniciais,
  });

  const [abaAtiva, setAbaAtiva] = useState<
    'contratual' | 'pessoal' | 'documentos' | 'endereco' | 'banco' | 'operacional'
  >('contratual');

  // Parâmetros dinâmicos do backend
  const [unidades, setUnidades] = useState<string[]>([]);
  const [cargos, setCargos] = useState<CargoItem[]>([]);
  const [equipes, setEquipes] = useState<string[]>([]);
  const [bancos, setBancos] = useState<string[]>([]);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [abrirMenuUnidades, setAbrirMenuUnidades] = useState(false);

  useEffect(() => {
    async function carregarParametros() {
      try {
        const [resUnid, resCargos, resEqp, resBco] = await Promise.all([
          api.get('/api/parametros?categoria=unidade'),
          api.get('/api/cargos'),
          api.get('/api/parametros?categoria=equipe'),
          api.get('/api/parametros?categoria=banco'),
        ]);

        setUnidades(resUnid.data.map((p: any) => (typeof p === 'string' ? p : p.valor || p.nome)));
        setCargos(resCargos.data || []);
        setEquipes(resEqp.data.map((p: any) => (typeof p === 'string' ? p : p.valor || p.nome)));
        setBancos(resBco.data.map((p: any) => (typeof p === 'string' ? p : p.valor || p.nome)));
      } catch (err) {
        console.error('Erro ao buscar parâmetros dinâmicos:', err);
      }
    }
    carregarParametros();
  }, []);

  const atualizarCampo = (campo: keyof ColaboradorCompleto, valor: any) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  // Preenche dados ao escolher função
  const lidarMudancaFuncao = (valorDigitado: string) => {
    const nomeLimpo = valorDigitado.toUpperCase();
    atualizarCampo('funcao', nomeLimpo);

    const cargoEncontrado = cargos.find((c) => c.nome.toUpperCase() === nomeLimpo);
    if (cargoEncontrado) {
      if (cargoEncontrado.cbo) {
        atualizarCampo('cbo', cargoEncontrado.cbo);
      }
      if (cargoEncontrado.salario_base !== undefined && cargoEncontrado.salario_base !== null) {
        atualizarCampo('salario', Number(cargoEncontrado.salario_base));
      }
      if (cargoEncontrado.jornada_padrao) {
        atualizarCampo('jornada', cargoEncontrado.jornada_padrao);
      }
    }
  };

  // Consulta endereço via CEP
  const lidarMudancaCep = async (valor: string) => {
    const cepFormatado = formatarCEP(valor);
    atualizarCampo('cep', cepFormatado);

    const cepLimpo = valor.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm((prev) => ({
            ...prev,
            endereco: data.logradouro || prev.endereco,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            uf_endereco: data.uf || prev.uf_endereco,
          }));
        }
      } catch (error) {
        console.error('Erro ao consultar ViaCEP:', error);
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nome || form.nome.trim() === '') {
      alert('O campo Nome é obrigatório!');
      setAbaAtiva('pessoal');
      return;
    }

    const dadosTratados = { ...form };
    (Object.keys(dadosTratados) as (keyof ColaboradorCompleto)[]).forEach((key) => {
      if (dadosTratados[key] === '') {
        dadosTratados[key] = null as any;
      }
    });

    await aoSalvar(dadosTratados);
  };

  const abas = [
    { id: 'contratual', label: '1. Contratual', icon: Briefcase },
    { id: 'pessoal', label: '2. Dados Pessoais', icon: User },
    { id: 'documentos', label: '3. Documentos', icon: FileText },
    { id: 'endereco', label: '4. Endereço', icon: MapPin },
    { id: 'banco', label: '5. Dados Bancários', icon: CreditCard },
    { id: 'operacional', label: '6. Operacional / EPIs', icon: ShieldAlert },
  ] as const;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/colaboradores"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {form.id ? `Editar: ${form.nome}` : 'Novo Colaborador / Pré-admissão'}
            </h1>
            <p className="text-xs text-slate-500">Preencha as informações cadastrais e operacionais</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={carregando}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {carregando ? 'Salvando...' : 'Salvar Colaborador'}
        </button>
      </div>

      {/* Navegador das Abas */}
      <div className="flex overflow-x-auto gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        {abas.map((aba) => {
          const Icone = aba.icon;
          const ativa = abaAtiva === aba.id;
          return (
            <button
              type="button"
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                ativa
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icone className="w-4 h-4" />
              {aba.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo das Abas */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {/* ABA 1: CONTRATUAL */}
        {abaAtiva === 'contratual' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
              <select
                value={form.status || 'ATIVO'}
                onChange={(e) => atualizarCampo('status', e.target.value)}
                className={selectClass}
              >
                <option value="PRE_ADMISSAO">Pré-Admissão</option>
                <option value="ATIVO">Ativo</option>
                <option value="AFASTADO">Afastado</option>
                <option value="INATIVO">Inativo / Demitido</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Matrícula / Cód. Registro</label>
              <input
                type="text"
                value={form.registro || ''}
                onChange={(e) => atualizarCampo('registro', e.target.value)}
                placeholder="Ex: 1845"
                className={inputClass}
              />
            </div>

            {/* Empresa / Unidade com Combobox */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-600 mb-1">Empresa / Unidade</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={form.matriz_filial || ''}
                  onFocus={() => setAbrirMenuUnidades(true)}
                  onChange={(e) => {
                    atualizarCampo('matriz_filial', e.target.value);
                    setAbrirMenuUnidades(true);
                  }}
                  placeholder="Selecione ou digite a unidade..."
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setAbrirMenuUnidades((prev) => !prev)}
                  className="absolute right-2 p-1 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${abrirMenuUnidades ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {abrirMenuUnidades && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setAbrirMenuUnidades(false)}
                  />
                  <ul className="absolute z-20 w-full mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg text-sm text-slate-800 py-1">
                    {unidades
                      .filter((u) =>
                        u.toLowerCase().includes((form.matriz_filial || '').toLowerCase())
                      )
                      .map((u, i) => (
                        <li
                          key={i}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            atualizarCampo('matriz_filial', u);
                            setAbrirMenuUnidades(false);
                          }}
                          className={`px-3 py-2 cursor-pointer transition-colors hover:bg-emerald-50 hover:text-emerald-700 ${
                            form.matriz_filial === u ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''
                          }`}
                        >
                          {u}
                        </li>
                      ))}

                    {unidades.filter((u) =>
                      u.toLowerCase().includes((form.matriz_filial || '').toLowerCase())
                    ).length === 0 && (
                      <li className="px-3 py-2 text-xs text-slate-400 italic">
                        Nenhuma unidade cadastrada com esse termo. O texto digitado será mantido.
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>

            {/* Função / Cargo vinculado com CBO e Salário */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Função / Cargo</label>
              <input
                type="text"
                list="lista-cargos"
                value={form.funcao || ''}
                onChange={(e) => lidarMudancaFuncao(e.target.value)}
                placeholder="Ex: MOTORISTA DE BITREM"
                className={inputClass}
              />
              <datalist id="lista-cargos">
                {cargos.map((c) => (
                  <option key={c.id} value={c.nome}>
                    {c.cbo ? `CBO: ${c.cbo} | ` : ''}R$ {Number(c.salario_base).toFixed(2)}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">CBO</label>
              <input
                type="text"
                value={form.cbo || ''}
                onChange={(e) => atualizarCampo('cbo', e.target.value)}
                placeholder="Ex: 782510"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Equipe / Frente de Trabalho</label>
              <input
                type="text"
                list="lista-equipes"
                value={form.equipe || ''}
                onChange={(e) => atualizarCampo('equipe', e.target.value.toUpperCase())}
                placeholder="Ex: TRANSPORTE 01"
                className={inputClass}
              />
              <datalist id="lista-equipes">
                {equipes.map((eq, i) => (
                  <option key={i} value={eq} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Centro de Custo / Setor</label>
              <input
                type="text"
                value={form.grupo || ''}
                onChange={(e) => atualizarCampo('grupo', e.target.value.toUpperCase())}
                placeholder="Ex: LOGISTICA"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Salário (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.salario ?? ''}
                onChange={(e) => atualizarCampo('salario', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0.00"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Jornada</label>
              <input
                type="text"
                value={form.jornada || ''}
                onChange={(e) => atualizarCampo('jornada', e.target.value)}
                placeholder="Ex: 220"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Data de Admissão</label>
              <input
                type="date"
                value={form.data_admissao || ''}
                onChange={(e) => atualizarCampo('data_admissao', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Término 1ª Experiência (45d)</label>
              <input
                type="date"
                value={form.fim_experiencia_1 || ''}
                onChange={(e) => atualizarCampo('fim_experiencia_1', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Término 2ª Experiência (90d)</label>
              <input
                type="date"
                value={form.fim_experiencia_2 || ''}
                onChange={(e) => atualizarCampo('fim_experiencia_2', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* ABA 2: DADOS PESSOAIS */}
        {abaAtiva === 'pessoal' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={form.nome || ''}
                onChange={(e) => atualizarCampo('nome', e.target.value.toUpperCase())}
                placeholder="Ex: CARLOS DA SILVA"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={form.data_nascimento || ''}
                onChange={(e) => atualizarCampo('data_nascimento', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Sexo</label>
              <select
                value={form.sexo || ''}
                onChange={(e) => atualizarCampo('sexo', e.target.value)}
                className={selectClass}
              >
                <option value="">Selecione</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Estado Civil</label>
              <select
                value={form.estado_civil || ''}
                onChange={(e) => atualizarCampo('estado_civil', e.target.value)}
                className={selectClass}
              >
                <option value="">Selecione</option>
                <option value="SOLTEIRO">Solteiro(a)</option>
                <option value="CASADO">Casado(a)</option>
                <option value="DIVORCIADO">Divorciado(a)</option>
                <option value="VIUVO">Viúvo(a)</option>
                <option value="UNIAO ESTAVEL">União Estável</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Raça / Cor</label>
              <select
                value={form.raca_cor || ''}
                onChange={(e) => atualizarCampo('raca_cor', e.target.value)}
                className={selectClass}
              >
                <option value="">Selecione</option>
                <option value="BRANCA">Branca</option>
                <option value="PARDA">Parda</option>
                <option value="PRETA">Preta</option>
                <option value="AMARELA">Amarela</option>
                <option value="INDIGENA">Indígena</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Grau de Instrução</label>
              <input
                type="text"
                value={form.grau_instrucao || ''}
                onChange={(e) => atualizarCampo('grau_instrucao', e.target.value)}
                placeholder="Ex: Ensino Médio Completo"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Cidade Natal (Naturalidade)</label>
              <input
                type="text"
                value={form.naturalidade || ''}
                onChange={(e) => atualizarCampo('naturalidade', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">UF Nascimento</label>
              <input
                type="text"
                maxLength={2}
                value={form.uf_naturalidade || ''}
                onChange={(e) => atualizarCampo('uf_naturalidade', e.target.value.toUpperCase())}
                placeholder="RS"
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Nome da Mãe</label>
              <input
                type="text"
                value={form.nome_mae || ''}
                onChange={(e) => atualizarCampo('nome_mae', e.target.value.toUpperCase())}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nome do Pai</label>
              <input
                type="text"
                value={form.nome_pai || ''}
                onChange={(e) => atualizarCampo('nome_pai', e.target.value.toUpperCase())}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Celular / WhatsApp</label>
              <input
                type="text"
                maxLength={15}
                value={form.celular || ''}
                onChange={(e) => atualizarCampo('celular', formatarTelefone(e.target.value))}
                placeholder="(51) 99999-9999"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => atualizarCampo('email', e.target.value.toLowerCase())}
                placeholder="colaborador@email.com"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* ABA 3: DOCUMENTAÇÃO */}
        {abaAtiva === 'documentos' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">CPF (apenas números)</label>
              <input
                type="text"
                maxLength={14}
                value={form.cpf || ''}
                onChange={(e) => atualizarCampo('cpf', formatarCPF(e.target.value))}
                placeholder="000.000.000-00"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">RG</label>
              <input
                type="text"
                value={form.rg || ''}
                onChange={(e) => atualizarCampo('rg', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Órgão Emissor / UF</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="SSP"
                  value={form.orgao_rg || ''}
                  onChange={(e) => atualizarCampo('orgao_rg', e.target.value.toUpperCase())}
                  className="w-2/3 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <input
                  type="text"
                  maxLength={2}
                  placeholder="RS"
                  value={form.uf_rg || ''}
                  onChange={(e) => atualizarCampo('uf_rg', e.target.value.toUpperCase())}
                  className="w-1/3 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">PIS / PASEP</label>
              <input
                type="text"
                value={form.pis || ''}
                onChange={(e) => atualizarCampo('pis', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">CTPS (Número)</label>
              <input
                type="text"
                value={form.ctps_numero || ''}
                onChange={(e) => atualizarCampo('ctps_numero', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Série CTPS / UF</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="0001"
                  value={form.ctps_serie || ''}
                  onChange={(e) => atualizarCampo('ctps_serie', e.target.value)}
                  className="w-2/3 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <input
                  type="text"
                  maxLength={2}
                  placeholder="RS"
                  value={form.uf_ctps || ''}
                  onChange={(e) => atualizarCampo('uf_ctps', e.target.value.toUpperCase())}
                  className="w-1/3 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">CNH (Número)</label>
              <input
                type="text"
                value={form.cnh || ''}
                onChange={(e) => atualizarCampo('cnh', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Categoria CNH</label>
              <input
                type="text"
                value={form.categoria_cnh || ''}
                onChange={(e) => atualizarCampo('categoria_cnh', e.target.value.toUpperCase())}
                placeholder="AB, C, D, E..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Título de Eleitor</label>
              <input
                type="text"
                value={form.titulo_eleitor || ''}
                onChange={(e) => atualizarCampo('titulo_eleitor', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* ABA 4: ENDEREÇO */}
        {abaAtiva === 'endereco' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
                <span>CEP</span>
                {buscandoCep && <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />}
              </label>
              <input
                type="text"
                maxLength={9}
                value={form.cep || ''}
                onChange={(e) => lidarMudancaCep(e.target.value)}
                placeholder="00000-000"
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Logradouro / Rua</label>
              <input
                type="text"
                value={form.endereco || ''}
                onChange={(e) => atualizarCampo('endereco', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Número</label>
              <input
                type="text"
                value={form.numero || ''}
                onChange={(e) => atualizarCampo('numero', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Complemento</label>
              <input
                type="text"
                value={form.complemento || ''}
                onChange={(e) => atualizarCampo('complemento', e.target.value)}
                placeholder="Apto, Casa, Bloco..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Bairro</label>
              <input
                type="text"
                value={form.bairro || ''}
                onChange={(e) => atualizarCampo('bairro', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Cidade</label>
              <input
                type="text"
                value={form.cidade || ''}
                onChange={(e) => atualizarCampo('cidade', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">UF</label>
              <input
                type="text"
                maxLength={2}
                value={form.uf_endereco || ''}
                onChange={(e) => atualizarCampo('uf_endereco', e.target.value.toUpperCase())}
                placeholder="RS"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* ABA 5: DADOS BANCÁRIOS */}
        {abaAtiva === 'banco' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Banco</label>
              <input
                type="text"
                list="lista-bancos"
                value={form.banco || ''}
                onChange={(e) => atualizarCampo('banco', e.target.value.toUpperCase())}
                placeholder="Ex: BANRISUL, ITAÚ, CEF"
                className={inputClass}
              />
              <datalist id="lista-bancos">
                {bancos.map((b, i) => (
                  <option key={i} value={b} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Agência</label>
              <input
                type="text"
                value={form.agencia || ''}
                onChange={(e) => atualizarCampo('agencia', e.target.value)}
                placeholder="Ex: 0150"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Número da Conta</label>
              <input
                type="text"
                value={form.numero_conta || ''}
                onChange={(e) => atualizarCampo('numero_conta', e.target.value)}
                placeholder="Ex: 123456-7"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tipo de Conta</label>
              <select
                value={form.tipo_conta || ''}
                onChange={(e) => atualizarCampo('tipo_conta', e.target.value)}
                className={selectClass}
              >
                <option value="">Selecione</option>
                <option value="Corrente">Conta Corrente</option>
                <option value="Poupança">Conta Poupança</option>
                <option value="Salário">Conta Salário</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Chave PIX</label>
              <input
                type="text"
                value={form.chave_pix || ''}
                onChange={(e) => atualizarCampo('chave_pix', e.target.value)}
                placeholder="CPF, celular, e-mail ou aleatória"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* ABA 6: OPERACIONAL / EPIS */}
        {abaAtiva === 'operacional' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Camiseta / Gandola</label>
              <input
                type="text"
                value={form.camiseta || ''}
                onChange={(e) => atualizarCampo('camiseta', e.target.value.toUpperCase())}
                placeholder="Ex: P, M, G, GG"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Calça</label>
              <input
                type="text"
                value={form.calca || ''}
                onChange={(e) => atualizarCampo('calca', e.target.value)}
                placeholder="Ex: 40, 42, 44"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Botina / Calçado</label>
              <input
                type="text"
                value={form.sapato || ''}
                onChange={(e) => atualizarCampo('sapato', e.target.value)}
                placeholder="Ex: 41, 42"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Jaqueta</label>
              <input
                type="text"
                value={form.jaqueta || ''}
                onChange={(e) => atualizarCampo('jaqueta', e.target.value.toUpperCase())}
                placeholder="Ex: G, GG"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tipo Sanguíneo</label>
              <select
                value={form.tipo_sanguineo || ''}
                onChange={(e) => atualizarCampo('tipo_sanguineo', e.target.value)}
                className={selectClass}
              >
                <option value="">Selecione</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-600 mb-1">Alergias / Restrições Médicas</label>
              <input
                type="text"
                value={form.alergia || ''}
                onChange={(e) => atualizarCampo('alergia', e.target.value)}
                placeholder="Ex: Abelha, dipirona, poeira..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">PCD (Possui Deficiência?)</label>
              <select
                value={form.possui_deficiencia || 'Não'}
                onChange={(e) => atualizarCampo('possui_deficiencia', e.target.value)}
                className={selectClass}
              >
                <option value="Não">Não</option>
                <option value="Sim">Sim</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-600 mb-1">Descrição da Deficiência</label>
              <input
                type="text"
                disabled={form.possui_deficiencia !== 'Sim'}
                value={form.descricao_deficiencia || ''}
                onChange={(e) => atualizarCampo('descricao_deficiencia', e.target.value)}
                placeholder="Descreva se houver laudo"
                className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-400`}
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
}