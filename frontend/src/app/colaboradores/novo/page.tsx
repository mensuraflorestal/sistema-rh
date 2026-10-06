'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { FormularioColaborador } from '@/components/colaboradores/FormularioColaborador';
import { ColaboradorCompleto } from '@/types/colaborador';

export default function NovoColaboradorPage() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);

  const salvarNovo = async (dados: Partial<ColaboradorCompleto>) => {
    setSalvando(true);
    try {
      await api.post('/api/colaboradores', dados);
      alert('Colaborador cadastrado com sucesso!');
      router.push('/colaboradores');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao salvar colaborador.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <FormularioColaborador aoSalvar={salvarNovo} carregando={salvando} />
      </div>
    </div>
  );
}