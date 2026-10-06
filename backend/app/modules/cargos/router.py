from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import obter_usuario_logado
from app.modules.cargos.models import Cargo

router = APIRouter(
    prefix="/api/cargos",
    tags=["Cargos e Salários"],
    dependencies=[Depends(obter_usuario_logado)],
)


class CargoCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=150)
    cbo: Optional[str] = Field(None, max_length=30)
    salario_base: Decimal = Field(..., ge=0, le=99999999.99)
    jornada_padrao: Optional[str] = Field("220", max_length=50)


class CargoResponse(BaseModel):
    id: int
    nome: str
    cbo: Optional[str] = None
    salario_base: Decimal
    jornada_padrao: Optional[str] = None
    ativo: bool

    class Config:
        from_attributes = True


@router.get("", response_model=List[CargoResponse])
def listar_cargos(db: Session = Depends(get_db)):
    return db.query(Cargo).filter(Cargo.ativo == True).order_by(Cargo.nome.asc()).all()


@router.post("", response_model=CargoResponse, status_code=status.HTTP_201_CREATED)
def criar_ou_atualizar_cargo(dados: CargoCreate, db: Session = Depends(get_db)):
    nome_limpo = dados.nome.strip().upper()
    cbo_limpo = dados.cbo.strip() if dados.cbo else None

    existente = db.query(Cargo).filter(Cargo.nome == nome_limpo).first()
    if existente:
        existente.cbo = cbo_limpo
        existente.salario_base = dados.salario_base
        existente.jornada_padrao = dados.jornada_padrao or "220"
        existente.ativo = True
        db.commit()
        db.refresh(existente)
        return existente

    novo = Cargo(
        nome=nome_limpo,
        cbo=cbo_limpo,
        salario_base=dados.salario_base,
        jornada_padrao=dados.jornada_padrao or "220",
        ativo=True,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


@router.delete("/{cargo_id}", status_code=status.HTTP_204_NO_CONTENT)
def desativar_cargo(cargo_id: int, db: Session = Depends(get_db)):
    cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()
    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo não encontrado.")

    cargo.ativo = False
    db.commit()
    return None