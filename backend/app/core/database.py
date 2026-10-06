from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Importa os models para o SQLAlchemy reconhecer antes do create_all
    import app.modules.colaboradores.models
    import app.modules.parametros.models
    import app.modules.usuarios.models
    import app.modules.cargos.models
    Base.metadata.create_all(bind=engine)