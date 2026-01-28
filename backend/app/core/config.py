from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str
    API_V1_STR: str = "/api"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    ALGORITHM: str = "HS256"
    
    DATABASE_URL: str
    
    VERTEX_AI_PROJECT_ID: Optional[str] = None
    VERTEX_AI_LOCATION: Optional[str] = "us-central1"
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    
    DASHSCOPE_API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()
