from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "rh_empresa"
    DB_USER: str = "postgres"
    DB_PASS: str = "22081973"

    @property
    def database_url(self) -> str:
        return f"postgresql+pg8000://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        env_file = ".env"

settings = Settings()