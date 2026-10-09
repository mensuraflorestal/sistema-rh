import type { StatusColaborador } from '@/lib/colaborador';

export type { StatusColaborador };

export interface Colaborador {
  id: string | number;
  nome: string;
  cpf: string;
  registro?: string;
  status: StatusColaborador;
  cargo_id?: string;

  // Contrato & Operação
  funcao?: string;
  cbo?: string;
  matriz_filial?: string;
  grupo?: string;
  equipe?: string;
  jornada?: string;
  salario?: number;
  data_admissao?: string;
  data_demissao?: string | null;
  motivo_demissao?: string | null;
  fim_experiencia_1?: string | null;
  fim_experiencia_2?: string | null;

  // Dados Pessoais & Família
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

  // Documentos
  rg?: string;
  orgao_rg?: string;
  uf_rg?: string;
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

  // Endereço & Contatos
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf_endereco?: string;
  telefone?: string;
  celular?: string;
  email?: string | null;

  // Financeiro & Bancário
  banco?: string;
  agencia?: string;
  numero_conta?: string;
  tipo_conta?: string;
  chave_pix?: string;

  // Saúde & EPIs / Tamanhos
  tipo_sanguineo?: string;
  alergia?: string;
  possui_deficiencia?: boolean | string;
  descricao_deficiencia?: string;
  camiseta?: string;
  calca?: string;
  sapato?: string;
  jaqueta?: string;

  // Metadados
  criado_em?: string;
  atualizado_em?: string;
}