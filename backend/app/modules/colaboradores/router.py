import math
from app.core.security import obter_usuario_logado
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.modules.colaboradores.models import Colaborador
from app.modules.colaboradores.schemas import (
    ColaboradorDetalhe,
    ColaboradorUpdate,
    ColaboradoresPaginados,
)

router = APIRouter(
    prefix="/api/colaboradores",
    tags=["Colaboradores"],
    dependencies=[Depends(obter_usuario_logado)]
)

@router.get("/estatisticas")
def obter_estatisticas(db: Session = Depends(get_db)):
    """Retorna os contadores rápidos para os cartões de topo."""
    total_ativos = db.query(Colaborador).filter(Colaborador.status == "ATIVO").count()
    total_afastados = db.query(Colaborador).filter(Colaborador.status == "AFASTADO").count()
    total_inativos = db.query(Colaborador).filter(Colaborador.status == "INATIVO").count()
    total_geral = db.query(Colaborador).count()
    return {
        "ativos": total_ativos,
        "afastados": total_afastados,
        "inativos": total_inativos,
        "total": total_geral,
    }

@router.get("", response_model=ColaboradoresPaginados)
def listar_colaboradores(
    busca: Optional[str] = None,
    status: Optional[str] = "ATIVO",
    unidade: Optional[str] = None,
    pagina: int = Query(1, ge=1),
    limite: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Colaborador)

    if status and status.upper() != "TODOS":
        query = query.filter(Colaborador.status == status.upper())

    if unidade and unidade.strip() != "":
        query = query.filter(Colaborador.matriz_filial.ilike(f"%{unidade.strip()}%"))

    if busca and busca.strip() != "":
        termo = f"%{busca.strip()}%"
        query = query.filter(
            (Colaborador.nome.ilike(termo))
            | (Colaborador.cpf.ilike(termo))
            | (Colaborador.registro.ilike(termo))
            | (Colaborador.funcao.ilike(termo))
            | (Colaborador.equipe.ilike(termo))
        )

    total_filtrado = query.count()
    total_paginas = math.ceil(total_filtrado / limite) if total_filtrado > 0 else 1
    offset = (pagina - 1) * limite
    itens = query.order_by(Colaborador.nome.asc()).offset(offset).limit(limite).all()

    return {
        "total": total_filtrado,
        "pagina": pagina,
        "limite": limite,
        "total_paginas": total_paginas,
        "itens": itens,
    }

@router.get("/{colab_id}", response_model=ColaboradorDetalhe)
def obter_colaborador(colab_id: int, db: Session = Depends(get_db)):
    colab = db.query(Colaborador).filter(Colaborador.id == colab_id).first()
    if not colab:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    return colab

@router.post("", response_model=ColaboradorDetalhe)
def salvar_colaborador(dados: ColaboradorUpdate, db: Session = Depends(get_db)):
    payload = dados.model_dump(exclude_unset=True)
    colab_id = payload.pop("id", None)

    cpf = payload.get("cpf")

    if colab_id:
        colab = db.query(Colaborador).filter(Colaborador.id == colab_id).first()
        if not colab:
            raise HTTPException(status_code=404, detail="Colaborador não encontrado.")
        
        # Garante que o CPF atualizado não colida com outro colaborador
        if cpf:
            conflito = db.query(Colaborador).filter(
                Colaborador.cpf == cpf,
                Colaborador.id != colab_id
            ).first()
            if conflito:
                raise HTTPException(status_code=400, detail="Este CPF já está cadastrado para outro colaborador.")

        for chave, valor in payload.items():
            setattr(colab, chave, valor)
    else:
        if cpf:
            existente = db.query(Colaborador).filter(Colaborador.cpf == cpf).first()
            if existente:
                raise HTTPException(status_code=400, detail="CPF já cadastrado no sistema.")
        colab = Colaborador(**payload)
        db.add(colab)

    db.commit()
    db.refresh(colab)
    return colab