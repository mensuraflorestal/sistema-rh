from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import SessionLocal, init_db
from app.modules.colaboradores.router import router as colaboradores_router
from app.modules.parametros.router import router as parametros_router
from app.modules.usuarios.router import router as usuarios_router
from app.modules.usuarios.models import Usuario
from app.modules.cargos.router import router as cargos_router
from app.core.security import gerar_hash_senha

app = FastAPI(title="RH Central API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuarios_router)
app.include_router(colaboradores_router)
app.include_router(parametros_router)
app.include_router(cargos_router)

def criar_admin_padrao():
    init_db()
    db = SessionLocal()
    try:
        admin = db.query(Usuario).filter(Usuario.is_admin == True).first()
        if not admin:
            admin_novo = Usuario(
                nome="Administrador",
                email="admin@empresa.com",
                senha_hash=gerar_hash_senha("admin123"),
                is_admin=True,
                ativo=True
            )
            db.add(admin_novo)
            db.commit()
            print(">> Utilizador Administrador padrão criado: admin@empresa.com / admin123")
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    criar_admin_padrao()

@app.get("/")
def healthcheck():
    return {"status": "ok", "app": "RH Central API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)