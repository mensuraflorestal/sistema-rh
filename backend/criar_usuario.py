from app.core.database import SessionLocal
from app.modules.usuarios.models import Usuario

def remover_usuario():
    db = SessionLocal()
    try:
        usuario = db.query(Usuario).filter(Usuario.id == 1).first()
        if usuario:
            db.delete(usuario)
            db.commit()
            print(f">> Utilizador '{usuario.email}' (ID {usuario.id}) removido com sucesso!")
        else:
            print(">> Utilizador ID 1 não encontrado.")
    except Exception as e:
        db.rollback()
        print(f"Erro ao remover: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    remover_usuario()