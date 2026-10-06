from sqlalchemy import Column, Integer, String, Numeric, Date, Text, DateTime, func
from app.core.database import Base

class Colaborador(Base):
    __tablename__ = "colaboradores"
    id = Column(Integer, primary_key=True, index=True)

    # 1. Dados Contratuais e Administrativos
    registro = Column(String(50), nullable=True, index=True)       # Cód Epr / Matrícula
    nome = Column(String(255), nullable=False, index=True)
    status = Column(String(50), default="ATIVO", index=True)       # PRE_ADMISSAO, ATIVO, INATIVO, AFASTADO
    funcao = Column(String(150), nullable=True)                    # Descrição cargo
    cbo = Column(String(20), nullable=True)
    equipe = Column(String(100), nullable=True)                    # Frente de trabalho
    grupo = Column(String(100), nullable=True)                     # Centro de Custo / Setor
    matriz_filial = Column(String(100), nullable=True)             # Unidade / Departamento
    salario = Column(Numeric(12, 2), nullable=True)
    jornada = Column(String(255), default="220")                    # Carga horária
    data_admissao = Column(Date, nullable=True)
    data_demissao = Column(Date, nullable=True)
    motivo_demissao = Column(String(255), nullable=True)
    fim_experiencia_1 = Column(Date, nullable=True)                # Fim determinado
    fim_experiencia_2 = Column(Date, nullable=True)                # Fim prorrogação

    # 2. Dados Pessoais & Contato
    data_nascimento = Column(Date, nullable=True)
    sexo = Column(String(20), nullable=True)
    estado_civil = Column(String(50), nullable=True)
    raca_cor = Column(String(50), nullable=True)
    grau_instrucao = Column(String(100), nullable=True)
    nacionalidade = Column(String(100), default="BRASILEIRA")
    naturalidade = Column(String(100), nullable=True)
    uf_naturalidade = Column(String(10), nullable=True)
    nome_mae = Column(String(255), nullable=True)
    nome_pai = Column(String(255), nullable=True)
    celular = Column(String(30), nullable=True)
    telefone = Column(String(30), nullable=True)
    email = Column(String(150), nullable=True)

    # 3. Documentação
    cpf = Column(String(20), unique=True, index=True, nullable=True)
    rg = Column(String(30), nullable=True)
    uf_rg = Column(String(10), nullable=True)
    orgao_rg = Column(String(30), nullable=True)
    expedicao_rg = Column(Date, nullable=True)
    pis = Column(String(30), nullable=True)
    ctps_numero = Column(String(50), nullable=True)
    ctps_serie = Column(String(50), nullable=True)
    uf_ctps = Column(String(10), nullable=True)
    cnh = Column(String(50), nullable=True)
    categoria_cnh = Column(String(10), nullable=True)
    titulo_eleitor = Column(String(50), nullable=True)
    zona_titulo = Column(String(20), nullable=True)
    secao_titulo = Column(String(20), nullable=True)
    reservista = Column(String(50), nullable=True)

    # 4. Endereço
    cep = Column(String(20), nullable=True)
    endereco = Column(String(255), nullable=True)
    numero = Column(String(50), nullable=True)
    complemento = Column(String(100), nullable=True)
    bairro = Column(String(100), nullable=True)
    cidade = Column(String(100), nullable=True)
    uf_endereco = Column(String(10), nullable=True)

    # 5. Dados Bancários
    banco = Column(String(100), nullable=True)
    agencia = Column(String(30), nullable=True)
    numero_conta = Column(String(50), nullable=True)
    tipo_conta = Column(String(50), nullable=True)
    chave_pix = Column(String(150), nullable=True)

    # 6. Operacional / Saúde / EPIs
    camiseta = Column(String(20), nullable=True)
    calca = Column(String(20), nullable=True)
    sapato = Column(String(20), nullable=True)
    jaqueta = Column(String(20), nullable=True)
    tipo_sanguineo = Column(String(10), nullable=True)
    alergia = Column(Text, nullable=True)
    possui_deficiencia = Column(String(10), default="Não")
    descricao_deficiencia = Column(Text, nullable=True)

    criado_em = Column(DateTime, server_default=func.now())
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now())