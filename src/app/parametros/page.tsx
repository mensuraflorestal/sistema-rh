'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { monitorarSessao } from '@/services/authService';
import { obterParametros, salvarParametros, Parametros } from '@/services/parametrosService';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building2, Network, Users, Trash2, Plus, Save } from 'lucide-react';

type Categoria = keyof Parametros;

export default function ParametrosPage() {
  const router = useRouter();
  const [parametros, setParametros] = useState<Parametros>({ filiais: [], grupos: [], equipas: [] });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [novoItem, setNovoItem] = useState<{ [key in Categoria]: string }>({ filiais: '', grupos: '', equipas: '' });

  useEffect(() => {
    const unsubscribe = monitorarSessao(async (user) => {
      if (!user) return router.push('/login');
      try {
        const dados = await obterParametros();
        setParametros(dados);
      } catch (err) {
        console.error('Erro ao carregar parâmetros:', err);
      } finally {
        setCarregando(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  function adicionarItem(categoria: Categoria) {
    const valor = novoItem[categoria].trim().toUpperCase();
    if (!valor || parametros[categoria].includes(valor)) return;

    setParametros((prev) => ({
      ...prev,
      [categoria]: [...prev[categoria], valor].sort(),
    }));
    setNovoItem((prev) => ({ ...prev, [categoria]: '' }));
  }

  function removerItem(categoria: Categoria, itemParaRemover: string) {
    setParametros((prev) => ({
      ...prev,
      [categoria]: prev[categoria].filter((item) => item !== itemParaRemover),
    }));
  }

  async function handleSalvarGeral() {
    setSalvando(true);
    try {
      await salvarParametros(parametros);
      alert('Parâmetros guardados com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao guardar os parâmetros.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const paineis: { id: Categoria; titulo: string; icone: any; desc: string }[] = [
    { id: 'filiais', titulo: 'Unidades / Filiais', icone: Building2, desc: 'Locais físicos da empresa.' },
    { id: 'grupos', titulo: 'Grupos Operacionais', icone: Network, desc: 'Divisão macro da operação.' },
    { id: 'equipas', titulo: 'Equipes', icone: Users, desc: 'Subdivisão de turmas em campo.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Parâmetros do Sistema</h1>
            <p className="text-sm text-slate-500 mt-1">Gerencie as listas de preenchimento automático para evitar erros de digitação.</p>
          </div>
          <Button onClick={handleSalvarGeral} carregando={salvando} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Save className="w-4 h-4" />
            Guardar Alterações
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paineis.map(({ id, titulo, icone: Icone, desc }) => (
            <Card key={id} className="flex flex-col h-[500px] p-0 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2 mb-1">
                  <Icone className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-bold text-slate-800">{titulo}</h2>
                </div>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>

              <div className="p-4 border-b border-slate-100 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={novoItem[id]}
                    onChange={(e) => setNovoItem((prev) => ({ ...prev, [id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && adicionarItem(id)}
                    placeholder="Adicionar novo..."
                    className="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Button type="button" onClick={() => adicionarItem(id)} className="h-9 px-3 bg-slate-800 hover:bg-slate-900">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                {parametros[id].length === 0 ? (
                  <div className="text-center text-sm text-slate-400 mt-10">Nenhum item cadastrado.</div>
                ) : (
                  <ul className="space-y-2">
                    {parametros[id].map((item) => (
                      <li key={item} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                        <span className="text-sm font-medium text-slate-700">{item}</span>
                        <button
                          onClick={() => removerItem(id, item)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          ))}
        </div>

      </main>
    </div>
  );
}