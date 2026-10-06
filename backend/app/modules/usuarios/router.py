from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    criar_token_acesso,
    exigir_admin,
    gerar_hash_senha,
    obter_usuario_logado,
    verificar_senha,
)
from app.modules.usuarios.models import Usuario

# Roteador com prefixo e tag
router = APIRouter(prefix="/api/usuarios", tags=["Usuários"])


class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    is_admin: Optional[bool] = False

    @field_validator("email")
    @classmethod
    def validar_email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("E-mail com formato inválido.")
        return v


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    is_admin: bool
    ativo: bool
    criado_em: Optional[datetime] = None

    class Config:
        from_attributes = True


# 1. Rota de Login (Gera Token JWT)
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == form_data.username.strip().lower()).first()
    if not usuario or not verificar_senha(form_data.password, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail ou senha incorretos."
        )
    if not usuario.ativo:
        raise HTTPException(status_code=400, detail="Usuário inativo.")

    token = criar_token_acesso(dados={"sub": usuario.email, "is_admin": usuario.is_admin})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id": usuario.id,
            "nome": usuario.nome,
            "email": usuario.email,
            "is_admin": usuario.is_admin,
        },
    }


# 2. Criar Novo Usuário (Apenas Admin)
@router.post("", response_model=UsuarioResponse)
def criar_usuario(
    dados: UsuarioCreate,
    db: Session = Depends(get_db),
    admin=Depends(exigir_admin),
):
    email_normalizado = dados.email.strip().lower()
    existente = db.query(Usuario).filter(Usuario.email == email_normalizado).first()
    if existente:
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado.")

    novo = Usuario(
        nome=dados.nome.strip(),
        email=email_normalizado,
        senha_hash=gerar_hash_senha(dados.senha),
        is_admin=dados.is_admin or False,
        ativo=True,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


# 3. Listar Usuários (Apenas Admin)
@router.get("", response_model=List[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db), admin=Depends(exigir_admin)):
    return db.query(Usuario).order_by(Usuario.nome.asc()).all()


# 4. Obter Perfil do Usuário Logado
@router.get("/me", response_model=UsuarioResponse)
def perfil_atual(usuario_atual=Depends(obter_usuario_logado)):
    return usuario_atual