export interface ColaboradorResumo {
  id: number;
  registro?: string;
  nome: string;
  status: 'ATIVO' | 'INATIVO' | 'AFASTADO' | 'PRE_ADMISSAO';
  funcao?: string;
  matriz_filial?: string;
  equipe?: string;
  celular?: string;
}

export interface Estatisticas {
  ativos: number;
  afastados: number;
  inativos: number;
  total: number;
}

export interface ColaboradorCompleto {
  id?: number;
  registro?: string;
  nome: string;
  status: string;
  funcao?: string;
  cbo?: string;
  equipe?: string;
  grupo?: string;
  matriz_filial?: string;
  salario?: number;
  jornada?: string;
  data_admissao?: string;
  data_demissao?: string;
  motivo_demissao?: string;
  fim_experiencia_1?: string;
  fim_experiencia_2?: string;

  data_nascimento?: string;
  sexo?: string;
  estado_civil?: string;
  raca_cor?: string;
  grau_instrucao?: string;
  nacionalidade?: string;
  naturalidade?: string;
  uf_naturalidade?: string;
  nome_mae?: string;
  nome_pai?: string;
  celular?: string;
  telefone?: string;
  email?: string;

  cpf?: string;
  rg?: string;
  uf_rg?: string;
  orgao_rg?: string;
  expedicao_rg?: string;
  pis?: string;
  ctps_numero?: string;
  ctps_serie?: string;
  uf_ctps?: string;
  cnh?: string;
  categoria_cnh?: string;
  titulo_eleitor?: string;
  zona_titulo?: string;
  secao_titulo?: string;
  reservista?: string;

  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf_endereco?: string;

  banco?: string;
  agencia?: string;
  numero_conta?: string;
  tipo_conta?: string;
  chave_pix?: string;

  camiseta?: string;
  calca?: string;
  sapato?: string;
  jaqueta?: string;
  tipo_sanguineo?: string;
  alergia?: string;
  possui_deficiencia?: string;
  descricao_deficiencia?: string;
}

export interface RespostaColaboradoresPaginada {
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
  itens: ColaboradorResumo[];
}