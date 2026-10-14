export type PerfilUsuario = 'admin' | 'rh_gestor' | 'leitor';

export interface UsuarioSistema {
  uid: string;
  email: string;
  nome: string;
  role: PerfilUsuario;
  ativo: boolean;
  filiais_permitidas?: string[];
}