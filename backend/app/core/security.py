from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/usuarios/login")

SECRET_KEY = "sua_chave_secreta_super_segura_mude_em_producao"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12  # 12 horas de sessão

def gerar_hash_senha(senha: str) -> str:
    senha_bytes = senha.encode("utf-8")[:72]
    sal = bcrypt.gensalt()
    return bcrypt.hashpw(senha_bytes, sal).decode("utf-8")

def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    senha_bytes = senha_plana.encode("utf-8")[:72]
    hash_bytes = senha_hash.encode("utf-8")
    try:
        return bcrypt.checkpw(senha_bytes, hash_bytes)
    except Exception:
        return False

def criar_token_acesso(dados: dict) -> str:
    payload = dados.copy()
    expira = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expira})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def obter_usuario_logado(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from app.modules.usuarios.models import Usuario

    credenciais_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou sessão expirada.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        dados = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = dados.get("sub")
        if email is None:
            raise credenciais_exception
    except Exception:
        raise credenciais_exception

    usuario = db.query(Usuario).filter(Usuario.email == email, Usuario.ativo == True).first()
    if usuario is None:
        raise credenciais_exception
    return usuario

def exigir_admin(usuario_atual=Depends(obter_usuario_logado)):
    if not usuario_atual.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito: apenas administradores podem executar esta ação."
        )
    return usuario_atual