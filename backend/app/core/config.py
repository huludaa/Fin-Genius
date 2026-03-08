from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 项目基础配置
    PROJECT_NAME: str = "Fin-Genius"
    API_V1_STR: str = "/api"
    
    # JWT 安全配置
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120 # token 有效期（分钟）
    ALGORITHM: str = "HS256" # token 加密算法
    SECRET_KEY: str # 密钥，环境变量注入
    
    # 数据库配置，环境变量注入
    DATABASE_URL: str
        
    # AI 服务集成配置，环境变量注入
    AI_API_KEY: Optional[str] = None
    AI_BASE_URL: Optional[str] = None
    AI_MODEL_NAME: Optional[str] = None
    
    class Config:
        env_file = ".env" # 自动加载 .env 配置文件
        case_sensitive = True # 环境变量区分大小写

# 导出配置实例
settings = Settings()
