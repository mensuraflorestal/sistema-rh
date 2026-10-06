from sqlalchemy import Column, Integer, String, DateTime, func
from app.core.database import Base

class Parametro(Base):
    __tablename__ = "parametros"

    id = Column(Integer, primary_key=True, index=True)
    categoria = Column(String(50), nullable=False, index=True)  # 'equipe', 'funcao', 'grupo', 'unidade', 'banco'
    valor = Column(String(150), nullable=False)
    ativo = Column(String(10), default="ATIVO")
    criado_em = Column(DateTime, server_default=func.now())