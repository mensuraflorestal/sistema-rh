from pydantic import BaseModel, field_validator
from typing import Optional, Any, List
from datetime import date, datetime
import re

def validar_digitos_cpf(cpf: str) -> bool:
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False
    # Primeiro dígito
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    resto = (soma * 10) % 11
    d1 = 0 if resto == 10 else resto
    if d1 != int(cpf[9]):
        return False
    # Segundo dígito
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    resto = (soma * 10) % 11
    d2 = 0 if resto == 10 else resto
    return d2 == int(cpf[10])

class ColaboradorBase(BaseModel):
    registro: Optional[str] = None
    nome: str
    status: Optional[str] = "ATIVO"
    funcao: Optional[str] = None
    cbo: Optional[str] = None
    equipe: Optional[str] = None
    grupo: Optional[str] = None
    matriz_filial: Optional[str] = None
    salario: Optional[float] = None
    jornada: Optional[str] = "220"
    data_admissao: Optional[date] = None
    data_demissao: Optional[date] = None
    motivo_demissao: Optional[str] = None
    fim_experiencia_1: Optional[date] = None
    fim_experiencia_2: Optional[date] = None

    data_nascimento: Optional[date] = None
    sexo: Optional[str] = None
    estado_civil: Optional[str] = None
    raca_cor: Optional[str] = None
    grau_instrucao: Optional[str] = None
    nacionalidade: Optional[str] = "BRASILEIRA"
    naturalidade: Optional[str] = None
    uf_naturalidade: Optional[str] = None
    nome_mae: Optional[str] = None
    nome_pai: Optional[str] = None
    celular: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None

    cpf: Optional[str] = None
    rg: Optional[str] = None
    uf_rg: Optional[str] = None
    orgao_rg: Optional[str] = None
    expedicao_rg: Optional[date] = None
    pis: Optional[str] = None
    ctps_numero: Optional[str] = None
    ctps_serie: Optional[str] = None
    uf_ctps: Optional[str] = None
    cnh: Optional[str] = None
    categoria_cnh: Optional[str] = None
    titulo_eleitor: Optional[str] = None
    zona_titulo: Optional[str] = None
    secao_titulo: Optional[str] = None
    reservista: Optional[str] = None

    cep: Optional[str] = None
    endereco: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf_endereco: Optional[str] = None

    banco: Optional[str] = None
    agencia: Optional[str] = None
    numero_conta: Optional[str] = None
    tipo_conta: Optional[str] = None
    chave_pix: Optional[str] = None

    camiseta: Optional[str] = None
    calca: Optional[str] = None
    sapato: Optional[str] = None
    jaqueta: Optional[str] = None
    tipo_sanguineo: Optional[str] = None
    alergia: Optional[str] = None
    possui_deficiencia: Optional[str] = "Não"
    descricao_deficiencia: Optional[str] = None

    @field_validator(
        "salario", "data_admissao", "data_demissao", "fim_experiencia_1",
        "fim_experiencia_2", "data_nascimento", "expedicao_rg",
        mode="before"
    )
    @classmethod
    def converter_vazio_para_none(cls, v: Any) -> Any:
        if v == "" or v is None:
            return None
        return v

    @field_validator("cpf", mode="before")
    @classmethod
    def formatar_e_validar_cpf(cls, v: Any) -> Optional[str]:
        if not v or str(v).strip() == "":
            return None
        apenas_num = re.sub(r"\D", "", str(v)).zfill(11)
        if not validar_digitos_cpf(apenas_num):
            raise ValueError("CPF inválido.")
        return apenas_num

    @field_validator("cep", mode="before")
    @classmethod
    def sanitizar_cep(cls, v: Any) -> Optional[str]:
        if not v or str(v).strip() == "":
            return None
        return re.sub(r"\D", "", str(v))

    @field_validator("nome", mode="before")
    @classmethod
    def padronizar_nome(cls, v: Any) -> str:
        if not v or not str(v).strip():
            raise ValueError("O nome é obrigatório.")
        return str(v).strip().upper()

class ColaboradorUpdate(ColaboradorBase):
    id: Optional[int] = None

class ColaboradorResumo(BaseModel):
    id: int
    registro: Optional[str] = None
    nome: str
    status: str
    funcao: Optional[str] = None
    matriz_filial: Optional[str] = None
    equipe: Optional[str] = None
    celular: Optional[str] = None

    class Config:
        from_attributes = True

class ColaboradorDetalhe(ColaboradorBase):
    id: int
    criado_em: Optional[datetime] = None
    atualizado_em: Optional[datetime] = None

    class Config:
        from_attributes = True

class ColaboradoresPaginados(BaseModel):
    total: int
    pagina: int
    limite: int
    total_paginas: int
    itens: List[ColaboradorResumo]

    class Config:
        from_attributes = True

ColaboradorResumo.model_rebuild()
ColaboradoresPaginados.model_rebuild()