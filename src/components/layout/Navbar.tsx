'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export function Navbar() {
  const pathname = usePathname();
  const { perfil, logout, temPermissao } = useAuth();

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/colaboradores', label: 'Colaboradores' },
    ...(temPermissao(['admin']) ? [
      { href: '/cargos', label: 'Cargos' },
      { href: '/parametros', label: 'Parâmetros' },
    ] : []),
  ];

  const formatarRole = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'rh_gestor': return 'RH / Gestor';
      case 'leitor': return 'Consulta';
      default: return 'Usuário';
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/logo.png" 
                alt="RS Florestal" 
                width={36} 
                height={36} 
                className="object-contain" 
              />
              <span className="font-bold text-lg text-emerald-800">
                RS Florestal
              </span>
            </Link>
            
            <div className="hidden sm:flex sm:space-x-4">
              {links.map((link) => {
                const ativo = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      ativo
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {perfil && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-800">{perfil.nome}</p>
                <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                  {formatarRole(perfil.role)}
                </span>
              </div>
            )}
            
            <button
              onClick={() => logout()}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}