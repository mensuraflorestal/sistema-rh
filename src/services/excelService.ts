import * as XLSX from 'xlsx';
import { Colaborador } from '@/types/colaborador';

export function exportarColaboradoresXLSX(colaboradores: Colaborador[], nomeArquivo = 'relatorio_colaboradores') {
  if (!colaboradores || colaboradores.length === 0) return;

  // Mapeia os campos internos para cabeçalhos
  const dadosPlanilha = colaboradores.map((c) => ({
    'Registro': c.registro || '',
    'Nome Completo': c.nome || '',
    'CPF': c.cpf || '',
    'Status': c.status || '',
    'Função': c.funcao || '',
    'CBO': c.cbo || '',
    'Unidade / Filial': c.matriz_filial || '',
    'Grupo Operacional': c.grupo || '',
    'Equipe': c.equipe || '',
    'Data de Admissão': c.data_admissao || '',
    'Data de Demissão': c.data_demissao || '',
    'Salário Base': c.salario ?? '',
    'Jornada': c.jornada || '',
    'Telefone / Celular': c.celular || c.telefone || '',
    'E-mail': c.email || '',
    'Cidade': c.cidade || '',
    'UF': c.uf_endereco || '',
    'Banco': c.banco || '',
    'Agência': c.agencia || '',
    'Conta': c.numero_conta || '',
    'Chave PIX': c.chave_pix || '',
    'Camiseta': c.camiseta || '',
    'Calça': c.calca || '',
    'Sapato': c.sapato || '',
    'Jaqueta': c.jaqueta || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(dadosPlanilha);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Colaboradores');

  const dataAtual = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${nomeArquivo}_${dataAtual}.xlsx`);
}