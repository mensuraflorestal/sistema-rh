'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { deslogar } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { LogOut, Users, Settings, Briefcase } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  usuarioEmail?: string | null;
}

export function Navbar({ usuarioEmail }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await deslogar();
    router.push('/login');
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Identidade */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <Image
              src="/logo.png"
              alt="RS Florestal"
              fill
              sizes="36px"
              className="object-contain"
              priority
            />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-base leading-none block">
              Gestão de Pessoas
            </span>
            <span className="text-[11px] font-medium text-emerald-700 tracking-wide block mt-0.5">
              RS FLORESTAL
            </span>
          </div>
        </div>

        {/* Links Rápidos */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50"
          >
            Início
          </Link>
          <Link
            href="/colaboradores"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Colaboradores
          </Link>
          <Link
            href="/parametros"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Parâmetros
          </Link>
          <Link
            href="/cargos"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Cargos
          </Link>
        </nav>

        {/* Usuário e Sair */}
        <div className="flex items-center gap-4">
          {usuarioEmail && (
            <span className="text-xs text-slate-500 hidden sm:inline">
              {usuarioEmail}
            </span>
          )}
          <Button
            variante="secondary"
            onClick={handleLogout}
            className="h-9 px-3 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}