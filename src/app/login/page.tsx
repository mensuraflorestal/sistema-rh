'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loginComEmail } from '@/services/authService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      await loginComEmail(email, senha);
      router.push('/');
    } catch {
      setErro('Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setCarregando(false);
    }
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

          <Button type="submit" carregando={carregando} className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700">
            Entrar no Sistema
          </Button>
        </form>
      </Card>
    </main>
  );
}