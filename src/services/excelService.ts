import * as XLSX from 'xlsx';
import { Colaborador } from '@/types/colaborador';
import { DadosFinanceiros } from './financeiroService';

/**
 * @param financeiro Dados financeiros por id de colaborador. Informe somente para
 * quem pode vê-los (admin/rh_gestor); sem ele, as colunas de salário e dados
 * bancários nem entram na planilha.
 */
export function exportarColaboradoresXLSX(
  colaboradores: Colaborador[],
  nomeArquivo = 'relatorio_colaboradores',
  financeiro: Map<string, DadosFinanceiros> | null = null
) {
  if (!colaboradores || colaboradores.length === 0) return;

  // Mapeia os campos internos para cabeçalhos
  const dadosPlanilha = colaboradores.map((c) => {
    const fin = financeiro?.get(String(c.id));

    return {
      'Registro': c.registro || '',
      'Nome Completo': c.nome || '',
      'CPF': c.cpf || '',
      'Data de Nascimento': c.data_nascimento || '',
      'Status': c.status || '',
      'Função': c.funcao || '',
      'CBO': c.cbo || '',
      'Unidade / Filial': c.matriz_filial || '',
      'Grupo Operacional': c.grupo || '',
      'Data de Admissão': c.data_admissao || '',
      'Data de Demissão': c.data_demissao || '',
      ...(financeiro ? { 'Salário Base': fin?.salario ?? '' } : {}),
      'Telefone / Celular': c.celular || c.telefone || '',
      'E-mail': c.email || '',
      'Cidade': c.cidade || '',
      'UF': c.uf_endereco || '',
      ...(financeiro
        ? {
            'Banco': fin?.banco || '',
            'Agência': fin?.agencia || '',
            'Conta': fin?.numero_conta || '',
            'Chave PIX': fin?.chave_pix || '',
          }
        : {}),
      'Camiseta': c.camiseta || '',
      'Calça': c.calca || '',
      'Sapato': c.sapato || '',
      'Jaqueta': c.jaqueta || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dadosPlanilha);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Colaboradores');

  const dataAtual = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${nomeArquivo}_${dataAtual}.xlsx`);
}