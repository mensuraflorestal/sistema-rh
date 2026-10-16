'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { UsuarioSistema, PerfilUsuario } from '@/types/usuario';
import { monitorarSessaoComPerfil, logout as authLogout } from '@/services/authService';

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
  podeVerTodasFiliais: true,
  filiaisPermitidas: [],
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<UsuarioSistema | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let montado = true;

    const unsubscribe = monitorarSessaoComPerfil((currentUser, currentPerfil) => {
      if (!montado) return;
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
    await authLogout();
    setUser(null);
    setPerfil(null);
  };

  const temPermissao = (perfisPermitidos: PerfilUsuario[]) => {
    if (!perfil) return false;
    return perfisPermitidos.includes(perfil.role);
  };

  const filiaisPermitidas = perfil?.filiais_permitidas || [];

  // Se tiver filiais cadastradas e NÃO tiver 'TODAS', fica restrito.
  // Se for admin ou não tiver restrições configuradas, vê tudo.
  const podeVerTodasFiliais = Boolean(
    perfil?.role === 'admin' ||
    filiaisPermitidas.includes('TODAS') ||
    filiaisPermitidas.length === 0
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