'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { UsuarioSistema, PerfilUsuario } from '@/types/usuario';
import { monitorarSessaoComPerfil, logout as authLogout } from '@/services/authService';
import { limparCacheColaboradores } from '@/services/colaboradoresService';

interface AuthContextType {
  user: User | null;
  perfil: UsuarioSistema | null;
  carregando: boolean;
  logout: () => Promise<void>;
  temPermissao: (perfisPermitidos: PerfilUsuario[]) => boolean;
  temAcessoFilial: (filial: string) => boolean;
  podeVerTodasFiliais: boolean;
  filiaisPermitidas: string[];
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  perfil: null,
  carregando: true,
  logout: async () => {},
  temPermissao: () => false,
  temAcessoFilial: () => false,
  podeVerTodasFiliais: false,
  filiaisPermitidas: [],
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<UsuarioSistema | null>(null);
  const [carregando, setCarregando] = useState(true);

  const uidAnterior = useRef<string | null>(null);

  useEffect(() => {
    let montado = true;

    const unsubscribe = monitorarSessaoComPerfil((currentUser, currentPerfil) => {
      if (!montado) return;
      const uidAtual = currentUser?.uid ?? null;
      if (uidAtual !== uidAnterior.current) {
        limparCacheColaboradores();
        uidAnterior.current = uidAtual;
      }
      setUser(currentUser);
      setPerfil(currentPerfil);
      setCarregando(false);
    });

    return () => {
      montado = false;
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    limparCacheColaboradores();
    await authLogout();
    setUser(null);
    setPerfil(null);
  };

  const temPermissao = (perfisPermitidos: PerfilUsuario[]) => {
    if (!perfil) return false;
    return perfisPermitidos.includes(perfil.role);
  };

  // Referência estável: evita refazer efeitos dependentes a cada render
  const filiaisPermitidas = useMemo(
    () => perfil?.filiais_permitidas || [],
    [perfil]
  );

  // Negação por padrão: só vê tudo quem é admin ou tem 'TODAS'.
  // Sem filiais atribuídas, o usuário não vê nenhum colaborador.
  const podeVerTodasFiliais = Boolean(
    perfil?.role === 'admin' || filiaisPermitidas.includes('TODAS')
  );

  const temAcessoFilial = (filial: string) => {
    if (podeVerTodasFiliais) return true;
    return filiaisPermitidas.includes(filial);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        carregando,
        logout,
        temPermissao,
        temAcessoFilial,
        podeVerTodasFiliais,
        filiaisPermitidas,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}