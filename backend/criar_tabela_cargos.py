from app.core.database import init_db

if __name__ == "__main__":
    init_db()
    print(">> Tabela 'cargos' verificada e criada com sucesso no PostgreSQL!")