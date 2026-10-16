'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { loginComEmail } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const { user, carregando: authCarregando } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!authCarregando && user) {
      window.location.replace('/');
    }
  }, [user, authCarregando]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvando(true);

    try {
      await loginComEmail(email, senha);
      window.location.replace('/');
    } catch {
      setErro('Credenciais inválidas. Verifique seu e-mail e senha.');
      setSalvando(false);
    }
  }

  // Enquanto a sessão está a ser lida pelo IndexedDB, bloqueia o ecrã inteiro.
  if (authCarregando || user) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative w-24 h-24 mb-3 drop-shadow-sm">
            <Image
              src="/logo.png"
              alt="RS Florestal"
              fill
              className="object-contain"
              priority
            />
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Gestão de Pessoas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            RS Florestal
          </p>
        </div>

        {erro && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="usuario@empresa.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          <Button type="submit" carregando={salvando} className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700">
            Entrar no Sistema
          </Button>
        </form>
      </Card>
    </main>
  );
}