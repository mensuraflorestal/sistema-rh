from typing import Any, List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import obter_usuario_logado
from app.modules.parametros.models import Parametro

router = APIRouter(
    prefix="/api/parametros",
    tags=["Parâmetros"],
    dependencies=[Depends(obter_usuario_logado)],
)


class ParametroCreate(BaseModel):
    categoria: str
    valor: str
    ativo: Optional[Union[bool, str]] = "SIM"


class ParametroResponse(BaseModel):
    id: int
    categoria: str
    valor: str
    ativo: Optional[Any] = "SIM"

    class Config:
        from_attributes = True


@router.get("", response_model=List[ParametroResponse])
def listar_parametros(
    categoria: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Parametro)

    # Filtro compatível com colunas VARCHAR/String do PostgreSQL
    if hasattr(Parametro, "ativo"):
        query = query.filter(
            or_(
                Parametro.ativo.is_(None),
                Parametro.ativo.in_(["SIM", "S", "true", "TRUE", "1"])
            )
        )

    if categoria:
        query = query.filter(Parametro.categoria == categoria.strip().lower())

    return query.order_by(Parametro.valor.asc()).all()


@router.post("", response_model=ParametroResponse, status_code=status.HTTP_201_CREATED)
def criar_parametro(
    dados: ParametroCreate,
    db: Session = Depends(get_db),
):
    categoria_limpa = dados.categoria.strip().lower()
    valor_limpo = dados.valor.strip().upper()

    existente = (
        db.query(Parametro)
        .filter(
            Parametro.categoria == categoria_limpa,
            Parametro.valor == valor_limpo,
        )
        .first()
    )

    if existente:
        if hasattr(existente, "ativo"):
            existente.ativo = "SIM"
            db.commit()
            db.refresh(existente)
            return existente
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este parâmetro já está cadastrado nesta categoria.",
        )

    novo = Parametro(
        categoria=categoria_limpa,
        valor=valor_limpo,
    )
    if hasattr(novo, "ativo"):
        valor_ativo = "SIM" if dados.ativo in [True, "SIM", "true", "1", "S"] else "NAO"
        novo.ativo = valor_ativo

    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


@router.delete("/{parametro_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_parametro(
    parametro_id: int,
    db: Session = Depends(get_db),
):
    item = db.query(Parametro).filter(Parametro.id == parametro_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parâmetro não encontrado.",
        )

    db.delete(item)
    db.commit()
    return None