'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { monitorarSessao } from '@/services/authService';
import { listarCargos, salvarCargo } from '@/services/cargosService';
import { Cargo } from '@/types/cargo';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Briefcase, Search, Plus, DollarSign, Clock, X } from 'lucide-react';

export default function CargosPage() {
  const router = useRouter();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  // Modal de criação/edição
  const [modalAberto, setModalAberto] = useState(false);
  const [cargoEditando, setCargoEditando] = useState<Cargo | null>(null);
  const [form, setForm] = useState<Partial<Cargo>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState('');

  useEffect(() => {
    const unsubscribe = monitorarSessao(async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const dados = await listarCargos();
        setCargos(dados);
      } catch (err) {
        console.error('Erro ao carregar cargos:', err);
      } finally {
        setCarregando(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return cargos.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.cbo?.toLowerCase().includes(termo)
    );
  }, [cargos, busca]);

  function abrirModal(cargo?: Cargo) {
    setErroSalvar(''); // Limpa erros antigos ao abrir
    if (cargo) {
      setCargoEditando(cargo);
      setForm(cargo);
    } else {
      setCargoEditando(null);
      setForm({ nome: '', cbo: '', salario_base: undefined, jornada: '', descricao: '' });
    }
    setModalAberto(true);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setErroSalvar('');
    setSalvando(true);

    try {
      const salvo = await salvarCargo({
        ...form,
        id: cargoEditando?.id, // <-- CRÍTICO: Garante que o ID original não se perde na edição
      });

      setCargos((atuais) => {
        const idx = atuais.findIndex((c) => String(c.id) === String(salvo.id));
        if (idx >= 0) {
          const copia = [...atuais];
          copia[idx] = salvo;
          return copia;
        }
        return [salvo, ...atuais];
      });

      setModalAberto(false);
    } catch (err: any) {
      console.error('Erro ao salvar cargo:', err);
      setErroSalvar(err.message || 'Erro ao comunicar com a base de dados.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Estrutura de Cargos</h1>
            <p className="text-sm text-slate-500 mt-1">
              {filtrados.length} cargos catalogados
            </p>
          </div>

          <Button
            onClick={() => abrirModal()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 text-xs"
          >
            <Plus className="w-4 h-4" />
            Novo Cargo
          </Button>
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por cargo ou CBO..."
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Lista / Grid de Cargos */}
        {carregando ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <Card className="text-center py-12 text-slate-500">
            Nenhum cargo encontrado.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map((cargo) => (
              <Card
                key={cargo.id}
                onClick={() => abrirModal(cargo)}
                className="hover:border-emerald-500 transition-all cursor-pointer p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      CBO: {cargo.cbo || 'S/N'}
                    </span>
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-base">
                    {cargo.nome}
                  </h3>
                  {cargo.descricao && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {cargo.descricao}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>
                      {cargo.salario_base
                        ? Number(cargo.salario_base).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                        : 'A combinar'}
                    </span>
                  </div>
                  {cargo.jornada && (
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{cargo.jornada}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Criação / Edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {cargoEditando ? 'Editar Cargo' : 'Novo Cargo'}
              </h2>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              {/* ALERTA DE ERRO */}
              {erroSalvar && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {erroSalvar}
                </div>
              )}
              
              <Input
                label="Nome da Função / Cargo *"
                value={form.nome || ''}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Código CBO"
                  value={form.cbo || ''}
                  onChange={(e) => setForm({ ...form, cbo: e.target.value })}
                />
                <Input
                  label="Jornada Padrão"
                  placeholder="Ex: 44h semanais"
                  value={form.jornada || ''}
                  onChange={(e) => setForm({ ...form, jornada: e.target.value })}
                />
              </div>

              <Input
                label="Piso / Salário Base (R$)"
                type="number"
                step="0.01"
                value={form.salario_base ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    salario_base: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Descrição / Atribuições</label>
                <textarea
                  value={form.descricao || ''}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Principais responsabilidades operacionais..."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <Button
                  type="button"
                  variante="secondary"
                  onClick={() => setModalAberto(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  carregando={salvando}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Salvar Cargo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}