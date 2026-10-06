'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { FormularioColaborador } from '@/components/colaboradores/FormularioColaborador';
import { ColaboradorCompleto } from '@/types/colaborador';

export default function EditarColaboradorPage() {
  const params = useParams();
  const router = useRouter();
  const [colaborador, setColaborador] = useState<ColaboradorCompleto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregarColaborador() {
      try {
        const res = await api.get<ColaboradorCompleto>(`/api/colaboradores/${params.id}`);
        setColaborador(res.data);
      } catch (err) {
        alert('Não foi possível carregar o colaborador.');
        router.push('/colaboradores');
      } finally {
        setCarregando(false);
      }
    }
    if (params.id) {
      carregarColaborador();
    }
  }, [params.id, router]);

const salvarEdicao = async (dados: Partial<ColaboradorCompleto>) => {
    setSalvando(true);
    try {
      // Converte o id da rota para número inteiro antes de enviar ao FastAPI
      const idNumerico = Number(params.id);
      await api.post('/api/colaboradores', { ...dados, id: idNumerico });
      alert('Colaborador atualizado com sucesso!');
      router.push('/colaboradores');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao atualizar colaborador.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500">
        Carregando dados do colaborador...
      </div>
    );
  }

  if (!colaborador) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <FormularioColaborador 
          dadosIniciais={colaborador} 
          aoSalvar={salvarEdicao} 
          carregando={salvando} 
        />
      </div>
    </div>
  );
}