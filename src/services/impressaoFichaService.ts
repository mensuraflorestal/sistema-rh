import { Colaborador } from '@/types/colaborador';
import { DadosFinanceiros } from '@/services/financeiroService';

function fmtData(data?: string | null): string {
  if (!data) return '-';
  const limpa = data.split('T')[0];
  const [a, m, d] = limpa.split('-');
  return a && m && d ? `${d}/${m}/${a}` : data;
}

function fmtCPF(cpf?: string): string {
  if (!cpf) return '-';
  const c = cpf.replace(/\D/g, '');
  return c.length === 11 ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf;
}

function fmtMoeda(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return '-';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function limpo(val: any): string {
  if (val === undefined || val === null || val === '') return '-';
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
  return String(val);
}

export function imprimirFichaColaborador(
  colaborador: Colaborador,
  financeiro?: DadosFinanceiros,
  podeVerSalario: boolean = false
) {
  const salario = financeiro?.salario ?? colaborador.salario;
  const banco = financeiro?.banco ?? colaborador.banco;
  const agencia = financeiro?.agencia ?? colaborador.agencia;
  const numero_conta = financeiro?.numero_conta ?? colaborador.numero_conta;
  const tipo_conta = financeiro?.tipo_conta ?? colaborador.tipo_conta;
  const chave_pix = financeiro?.chave_pix ?? colaborador.chave_pix;

  const dataEmissao = new Date().toLocaleString('pt-BR');

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Ficha Cadastral - ${limpo(colaborador.nome)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #1e293b;
      font-size: 11px;
      line-height: 1.35;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2px solid #0f766e;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header h1 {
      margin: 0 0 2px 0;
      font-size: 18px;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header .subtitle {
      font-size: 12px;
      color: #475569;
      font-weight: 600;
    }
    .header .meta {
      text-align: right;
      font-size: 9px;
      color: #64748b;
    }
    .section {
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .section-title {
      background: #f1f5f9;
      color: #0f766e;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      padding: 4px 8px;
      border-left: 3px solid #0f766e;
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    }
    .grid {
      display: grid;
      gap: 6px 12px;
    }
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-4 { grid-template-columns: repeat(4, 1fr); }
    .grid-5 { grid-template-columns: repeat(5, 1fr); }
    
    .field {
      display: flex;
      flex-direction: column;
    }
    .field-label {
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: bold;
      margin-bottom: 1px;
    }
    .field-value {
      font-size: 11px;
      color: #0f172a;
      font-weight: 500;
      border-bottom: 1px dotted #cbd5e1;
      padding-bottom: 2px;
      min-height: 14px;
    }
    .highlight {
      color: #0f766e;
      font-weight: bold;
    }
    .footer {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .signature-box {
      width: 45%;
      text-align: center;
      padding-top: 25px;
      border-top: 1px solid #0f172a;
      font-size: 10px;
      font-weight: 600;
      color: #334155;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>RS Florestal</h1>
      <div class="subtitle">Ficha Cadastral do Colaborador</div>
    </div>
    <div class="meta">
      <div>Emissão: ${dataEmissao}</div>
      <div>Status: <strong>${limpo(colaborador.status)}</strong></div>
      <div>Matrícula / Reg: <strong>${limpo(colaborador.registro)}</strong></div>
    </div>
  </div>

  <!-- DADOS PESSOAIS -->
  <div class="section">
    <div class="section-title">1. Dados Pessoais & Identificação</div>
    <div class="grid grid-3">
      <div class="field" style="grid-column: span 2;">
        <span class="field-label">Nome Completo</span>
        <span class="field-value highlight">${limpo(colaborador.nome)}</span>
      </div>
      <div class="field">
        <span class="field-label">CPF</span>
        <span class="field-value highlight">${fmtCPF(colaborador.cpf)}</span>
      </div>
    </div>
    <div class="grid grid-4" style="margin-top: 6px;">
      <div class="field">
        <span class="field-label">Data de Nascimento</span>
        <span class="field-value">${fmtData(colaborador.data_nascimento)}</span>
      </div>
      <div class="field">
        <span class="field-label">Sexo</span>
        <span class="field-value">${limpo(colaborador.sexo)}</span>
      </div>
      <div class="field">
        <span class="field-label">Estado Civil</span>
        <span class="field-value">${limpo(colaborador.estado_civil)}</span>
      </div>
      <div class="field">
        <span class="field-label">Raça / Cor</span>
        <span class="field-value">${limpo(colaborador.raca_cor)}</span>
      </div>
    </div>
    <div class="grid grid-3" style="margin-top: 6px;">
      <div class="field">
        <span class="field-label">Nacionalidade</span>
        <span class="field-value">${limpo(colaborador.nacionalidade)}</span>
      </div>
      <div class="field">
        <span class="field-label">Naturalidade</span>
        <span class="field-value">${limpo(colaborador.naturalidade)} ${colaborador.uf_naturalidade ? `(${colaborador.uf_naturalidade})` : ''}</span>
      </div>
      <div class="field">
        <span class="field-label">Grau de Instrução</span>
        <span class="field-value">${limpo(colaborador.grau_instrucao)}</span>
      </div>
    </div>
    <div class="grid grid-2" style="margin-top: 6px;">
      <div class="field">
        <span class="field-label">Nome da Mãe</span>
        <span class="field-value">${limpo(colaborador.nome_mae)}</span>
      </div>
      <div class="field">
        <span class="field-label">Nome do Pai</span>
        <span class="field-value">${limpo(colaborador.nome_pai)}</span>
      </div>
    </div>
  </div>

  <!-- DOCUMENTAÇÃO -->
  <div class="section">
    <div class="section-title">2. Documentos</div>
    <div class="grid grid-4">
      <div class="field">
        <span class="field-label">RG / Órgão / UF</span>
        <span class="field-value">${limpo(colaborador.rg)} ${colaborador.orgao_rg || ''} ${colaborador.uf_rg || ''}</span>
      </div>
      <div class="field">
        <span class="field-label">Data Expedição RG</span>
        <span class="field-value">${fmtData(colaborador.expedicao_rg)}</span>
      </div>
      <div class="field">
        <span class="field-label">PIS / PASEP / NIT</span>
        <span class="field-value">${limpo(colaborador.pis)}</span>
      </div>
      <div class="field">
        <span class="field-label">CTPS / Série / UF</span>
        <span class="field-value">${limpo(colaborador.ctps_numero)} ${colaborador.ctps_serie ? `série ${colaborador.ctps_serie}` : ''} ${colaborador.uf_ctps || ''}</span>
      </div>
    </div>
    <div class="grid grid-4" style="margin-top: 6px;">
      <div class="field">
        <span class="field-label">CNH / Categoria</span>
        <span class="field-value">${limpo(colaborador.cnh)} ${colaborador.categoria_cnh ? `(${colaborador.categoria_cnh})` : ''}</span>
      </div>
      <div class="field">
        <span class="field-label">Título de Eleitor</span>
        <span class="field-value">${limpo(colaborador.titulo_eleitor)}</span>
      </div>
      <div class="field">
        <span class="field-label">Zona / Seção</span>
        <span class="field-value">${colaborador.zona_titulo || colaborador.secao_titulo ? `Zona ${colaborador.zona_titulo || '-'} / Seção ${colaborador.secao_titulo || '-'}` : '-'}</span>
      </div>
      <div class="field">
        <span class="field-label">Certificado de Reservista</span>
        <span class="field-value">${limpo(colaborador.reservista)}</span>
      </div>
    </div>
  </div>

  <!-- CONTRATO E CARGO -->
  <div class="section">
    <div class="section-title">3. Dados Contratuais & Cargo</div>
    <div class="grid grid-4">
      <div class="field">
        <span class="field-label">Função / Cargo</span>
        <span class="field-value highlight">${limpo(colaborador.funcao)}</span>
      </div>
      <div class="field">
        <span class="field-label">CBO</span>
        <span class="field-value">${limpo(colaborador.cbo)}</span>
      </div>
      <div class="field">
        <span class="field-label">Filial / Matriz</span>
        <span class="field-value">${limpo(colaborador.matriz_filial)}</span>
      </div>
      <div class="field">
        <span class="field-label">Data de Admissão</span>
        <span class="field-value highlight">${fmtData(colaborador.data_admissao)}</span>
      </div>
    </div>
    <div class="grid grid-4" style="margin-top: 6px;">
      <div class="field">
        <span class="field-label">Jornada de Trabalho</span>
        <span class="field-value">${limpo(colaborador.jornada)}</span>
      </div>
      <div class="field">
        <span class="field-label">Grupo / Setor</span>
        <span class="field-value">${limpo(colaborador.grupo)}</span>
      </div>
      <div class="field">
        <span class="field-label">Equipe</span>
        <span class="field-value">${limpo(colaborador.equipe)}</span>
      </div>
      <div class="field">
        <span class="field-label">Salário Base</span>
        <span class="field-value highlight">
          ${podeVerSalario ? (salario !== undefined ? fmtMoeda(salario) : '-') : 'Restrito à Gestão'}
        </span>
      </div>
    </div>
    <div class="grid grid-3" style="margin-top: 6px;">
      <div class="field">
        <span class="field-label">1º Término de Experiência</span>
        <span class="field-value">${fmtData(colaborador.fim_experiencia_1)}</span>
      </div>
      <div class="field">
        <span class="field-label">2º Término de Experiência</span>
        <span class="field-value">${fmtData(colaborador.fim_experiencia_2)}</span>
      </div>
      <div class="field">
        <span class="field-label">Data de Desligamento</span>
        <span class="field-value">${colaborador.data_demissao ? `${fmtData(colaborador.data_demissao)} (${colaborador.motivo_demissao || 'Não informado'})` : '-'}</span>
      </div>
    </div>
  </div>

  <!-- ENDEREÇO E CONTATOS -->
  <div class="section">
    <div class="section-title">4. Endereço & Contatos</div>
    <div class="grid grid-4">
      <div class="field" style="grid-column: span 2;">
        <span class="field-label">Logradouro, Nº e Complemento</span>
        <span class="field-value">${limpo(colaborador.endereco)}, ${limpo(colaborador.numero)} ${colaborador.complemento ? `(${colaborador.complemento})` : ''}</span>
      </div>
      <div class="field">
        <span class="field-label">Bairro</span>
        <span class="field-value">${limpo(colaborador.bairro)}</span>
      </div>
      <div class="field">
        <span class="field-label">CEP</span>
        <span class="field-value">${limpo(colaborador.cep)}</span>
      </div>
    </div>
    <div class="grid grid-4" style="margin-top: 6px;">
      <div class="field">
        <span class="field-label">Cidade / UF</span>
        <span class="field-value">${limpo(colaborador.cidade)} / ${limpo(colaborador.uf_endereco)}</span>
      </div>
      <div class="field">
        <span class="field-label">Telefone Fixo</span>
        <span class="field-value">${limpo(colaborador.telefone)}</span>
      </div>
      <div class="field">
        <span class="field-label">Celular / WhatsApp</span>
        <span class="field-value">${limpo(colaborador.celular)}</span>
      </div>
      <div class="field">
        <span class="field-label">E-mail</span>
        <span class="field-value">${limpo(colaborador.email)}</span>
      </div>
    </div>
  </div>

  <!-- DADOS BANCÁRIOS -->
  <div class="section">
    <div class="section-title">5. Dados Bancários para Pagamento</div>
    ${
      podeVerSalario
        ? `
      <div class="grid grid-5">
        <div class="field">
          <span class="field-label">Banco</span>
          <span class="field-value">${limpo(banco)}</span>
        </div>
        <div class="field">
          <span class="field-label">Agência</span>
          <span class="field-value">${limpo(agencia)}</span>
        </div>
        <div class="field">
          <span class="field-label">Conta Corrente / Poupança</span>
          <span class="field-value">${limpo(numero_conta)}</span>
        </div>
        <div class="field">
          <span class="field-label">Tipo de Conta</span>
          <span class="field-value">${limpo(tipo_conta)}</span>
        </div>
        <div class="field">
          <span class="field-label">Chave PIX</span>
          <span class="field-value">${limpo(chave_pix)}</span>
        </div>
      </div>
      `
        : `
      <div style="padding: 6px; background: #f8fafc; border: 1px dashed #cbd5e1; font-style: italic; color: #64748b;">
        Dados bancários restritos aos perfis de Gestão (RH Gestor / Administrador).
      </div>
      `
    }
  </div>

  <!-- SAÚDE & UNIFORMES -->
  <div class="section">
    <div class="section-title">6. Saúde, PCD & Uniformes / EPIs</div>
    <div class="grid grid-3">
      <div class="field">
        <span class="field-label">Tipo Sanguíneo</span>
        <span class="field-value">${limpo(colaborador.tipo_sanguineo)}</span>
      </div>
      <div class="field">
        <span class="field-label">Alergias</span>
        <span class="field-value">${limpo(colaborador.alergia)}</span>
      </div>
      <div class="field">
        <span class="field-label">Pessoa com Deficiência (PCD)</span>
        <span class="field-value">${colaborador.possui_deficiencia ? `Sim: ${colaborador.descricao_deficiencia || 'Não detalhada'}` : 'Não'}</span>
      </div>
    </div>
    <div class="grid grid-4" style="margin-top: 6px;">
      <div class="field">
        <span class="field-label">Camiseta</span>
        <span class="field-value">${limpo(colaborador.camiseta)}</span>
      </div>
      <div class="field">
        <span class="field-label">Calça</span>
        <span class="field-value">${limpo(colaborador.calca)}</span>
      </div>
      <div class="field">
        <span class="field-label">Sapato / Bota</span>
        <span class="field-value">${limpo(colaborador.sapato)}</span>
      </div>
      <div class="field">
        <span class="field-label">Jaqueta</span>
        <span class="field-value">${limpo(colaborador.jaqueta)}</span>
      </div>
    </div>
  </div>

  <!-- ASSINATURAS -->
  <div class="footer">
    <div class="signature-box">
      Responsável RH / Contabilidade
    </div>
    <div class="signature-box">
      ${limpo(colaborador.nome)}<br/>
      Assinatura do Colaborador
    </div>
  </div>

  <script>
    window.onload = function() {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

