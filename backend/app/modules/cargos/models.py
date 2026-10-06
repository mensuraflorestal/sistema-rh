from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean
from app.core.database import Base

class Cargo(Base):
    __tablename__ = "cargos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), unique=True, nullable=False, index=True)
    cbo = Column(String(20), nullable=True)
    salario_base = Column(Numeric(10, 2), nullable=False, default=0.00)
    jornada_padrao = Column(String(50), nullable=True, default="220")
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)