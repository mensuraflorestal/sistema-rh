'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import {
  Building2,
  Briefcase,
  Users,
  CreditCard,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

type Categoria = 'unidade' | 'funcao' | 'equipe' | 'banco';

interface ItemGenerico {
  id: number;
  valor: string;
}

interface CargoItem {
  id: number;
  nome: string;
  cbo?: string;
  salario_base: number;
  jornada_padrao?: string;
}

const CATEGORIAS_CONFIG: {
  id: Categoria;
  titulo: string;
  descricao: string;
  icone: any;
  placeholder: string;
}[] = [
  {
    id: 'unidade',
    titulo: 'Empresas / Unidades',
    descricao: 'Filiais, fazendas e bases operacionais',
    icone: Building2,
    placeholder: 'Ex: FILIAL - BUTIÁ',
  },
  {
    id: 'funcao',
    titulo: 'Funções / Cargos',
    descricao: 'Tabela salarial, CBO e jornadas padrão',
    icone: Briefcase,
    placeholder: 'Ex: MOTORISTA DE BITREM',
  },
  {
    id: 'equipe',
    titulo: 'Equipes / Frentes',
    descricao: 'Equipes de campo, transporte e colheita',
    icone: Users,
    placeholder: 'Ex: TRANSPORTE 01',
  },
  {
    id: 'banco',
    titulo: 'Bancos / Contas',
    descricao: 'Instituições bancárias para folha de pagamento',
    icone: CreditCard,
    placeholder: 'Ex: BANRISUL',
  },
];

export default function ParametrosPage() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<Categoria>('unidade');
  const [itens, setItens] = useState<ItemGenerico[]>([]);
  const [cargos, setCargos] = useState<CargoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Estados dos formulários de inserção
  const [novoValor, setNovoValor] = useState('');
  const [novoCargo, setNovoCargo] = useState({
    nome: '',
    cbo: '',
    salario_base: '',
    jornada_padrao: '220',
  });

  const extrairMensagemErro = (err: any, padrao: string): string => {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: any) => d.msg || 'Erro de validação').join(', ');
    }
    return padrao;
  };

  const carregarDados = async (cat: Categoria) => {
    setCarregando(true);
    setMensagem(null);
    try {
      if (cat === 'funcao') {
        const res = await api.get('/api/cargos');
        setCargos(res.data);
      } else {
        const res = await api.get(`/api/parametros?categoria=${cat}`);
        const lista: ItemGenerico[] = res.data.map((p: any) => ({
          id: p.id,
          valor: typeof p === 'string' ? p : p.valor || p.nome,
        }));
        setItens(lista);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setMensagem({
        tipo: 'erro',
        texto: extrairMensagemErro(err, 'Erro ao carregar dados do servidor.'),
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados(categoriaAtiva);
  }, [categoriaAtiva]);

  // Gravar Item Genérico
  const handleAdicionarGenerico = async (e: React.FormEvent) => {
    e.preventDefault();
    const textoLimpo = novoValor.trim().toUpperCase();
    if (!textoLimpo) return;

    setSalvando(true);
    setMensagem(null);
    try {
      const res = await api.post('/api/parametros', {
        categoria: categoriaAtiva,
        valor: textoLimpo,
        ativo: 'SIM',
      });
      setItens((prev) => [...prev, { id: res.data.id, valor: res.data.valor }].sort((a, b) => a.valor.localeCompare(b.valor)));
      setNovoValor('');
      setMensagem({ tipo: 'sucesso', texto: 'Registro cadastrado com sucesso!' });
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: extrairMensagemErro(err, 'Erro ao cadastrar registro.') });
    } finally {
      setSalvando(false);
    }
  };

  // Gravar Cargo Estruturado
  const handleAdicionarCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCargo.nome.trim() || !novoCargo.salario_base) return;

    setSalvando(true);
    setMensagem(null);
    try {
      const res = await api.post('/api/cargos', {
        nome: novoCargo.nome.trim().toUpperCase(),
        cbo: novoCargo.cbo.trim() || null,
        salario_base: parseFloat(novoCargo.salario_base),
        jornada_padrao: novoCargo.jornada_padrao.trim() || '220',
      });
      setCargos((prev) => {
        const filtrado = prev.filter((c) => c.id !== res.data.id);
        return [...filtrado, res.data].sort((a, b) => a.nome.localeCompare(b.nome));
      });
      setNovoCargo({ nome: '', cbo: '', salario_base: '', jornada_padrao: '220' });
      setMensagem({ tipo: 'sucesso', texto: 'Cargo cadastrado com sucesso!' });
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: extrairMensagemErro(err, 'Erro ao salvar cargo.') });
    } finally {
      setSalvando(false);
    }
  };

  // Excluir Item
  const handleExcluir = async (id: number, nome: string) => {
    if (!confirm(`Deseja remover "${nome}"?`)) return;

    try {
      if (categoriaAtiva === 'funcao') {
        await api.delete(`/api/cargos/${id}`);
        setCargos((prev) => prev.filter((c) => c.id !== id));
      } else {
        await api.delete(`/api/parametros/${id}`);
        setItens((prev) => prev.filter((i) => i.id !== id));
      }
      setMensagem({ tipo: 'sucesso', texto: `"${nome}" removido!` });
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: extrairMensagemErro(err, 'Erro ao remover registro.') });
    }
  };

  const configAtual = CATEGORIAS_CONFIG.find((c) => c.id === categoriaAtiva)!;
  const IconeAtual = configAtual.icone;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/colaboradores"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Parâmetros do Sistema</h1>
            <p className="text-xs text-slate-500">Gerenciamento de unidades, frentes, bancos e tabela de cargos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CATEGORIAS_CONFIG.map((cat) => {
          const Icone = cat.icone;
          const ativa = categoriaAtiva === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                ativa
                  ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2.5 rounded-lg ${ativa ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Icone className="w-5 h-5" />
                </div>
                {ativa && (
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Ativo
                  </span>
                )}
              </div>
              <div>
                <h3 className={`text-sm font-bold ${ativa ? 'text-emerald-950' : 'text-slate-800'}`}>{cat.titulo}</h3>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{cat.descricao}</p>
              </div>
            </button>
          );
        })}
      </div>

      {mensagem && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            mensagem.tipo === 'sucesso' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {mensagem.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-medium">{mensagem.texto}</span>
          </div>
          <button onClick={() => setMensagem(null)} className="text-[11px] font-bold underline opacity-70 hover:opacity-100">
            Fechar
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <IconeAtual className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{configAtual.titulo}</h2>
              <p className="text-xs text-slate-500">{configAtual.descricao}</p>
            </div>
          </div>

          {/* Seletor do formulário: Cargos vs Genérico */}
          {categoriaAtiva === 'funcao' ? (
            <form onSubmit={handleAdicionarCargo} className="grid grid-cols-1 sm:grid-cols-4 gap-2 w-full max-w-2xl">
              <input
                type="text"
                required
                placeholder="Título do Cargo *"
                value={novoCargo.nome}
                onChange={(e) => setNovoCargo({ ...novoCargo, nome: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
              <input
                type="text"
                placeholder="CBO (Ex: 7825-10)"
                value={novoCargo.cbo}
                onChange={(e) => setNovoCargo({ ...novoCargo, cbo: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
              <input
                type="number"
                step="0.01"
                required
                placeholder="Salário Base (R$) *"
                value={novoCargo.salario_base}
                onChange={(e) => setNovoCargo({ ...novoCargo, salario_base: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Cadastrar Cargo</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdicionarGenerico} className="flex items-center gap-2 max-w-md w-full">
              <input
                type="text"
                required
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
                placeholder={configAtual.placeholder}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={salvando || !novoValor.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Adicionar</>}
              </button>
            </form>
          )}
        </div>

        <div className="p-5">
          {carregando ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs">Carregando itens cadastrados...</p>
            </div>
          ) : categoriaAtiva === 'funcao' ? (
            cargos.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm font-medium text-slate-600">Nenhum cargo cadastrado na tabela salarial</p>
                <p className="text-xs mt-1">Utilize os campos acima para cadastrar o primeiro cargo com salário base.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Função / Cargo</th>
                      <th className="py-3 px-4">CBO</th>
                      <th className="py-3 px-4">Salário Base (R$)</th>
                      <th className="py-3 px-4">Jornada</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cargos.map((cargo) => (
                      <tr key={cargo.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800">{cargo.nome}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{cargo.cbo || '-'}</td>
                        <td className="py-3 px-4 text-emerald-700 font-semibold">
                          {Number(cargo.salario_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{cargo.jornada_padrao || '220'}h</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleExcluir(cargo.id, cargo.nome)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            itens.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm font-medium text-slate-600">Nenhum registro encontrado</p>
                <p className="text-xs mt-1">Utilize o campo acima para adicionar o primeiro item.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {itens.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white transition-colors group"
                  >
                    <span className="text-sm font-semibold text-slate-800 truncate pr-2">{item.valor}</span>
                    <button
                      type="button"
                      onClick={() => handleExcluir(item.id, item.valor)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-80 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}