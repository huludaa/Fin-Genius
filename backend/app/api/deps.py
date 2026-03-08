from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.core import security
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.token import TokenPayload

# 定义 OAuth2 密码模式认证方案，指定获取令牌的接口地址
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/token" 
)

def get_db() -> Generator:
    """
    获取数据库会话，并在请求结束时自动关闭
    """
    try:
        db = SessionLocal() # 获取数据库会话
        yield db # 返回数据库会话
    finally:
        db.close() # 关闭数据库连接

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2) # Depends(reusable_oauth2)：依赖注入，获取 JWT 令牌
) -> User:
    """
    通用依赖拦截器：验证 JWT 令牌并返回当前登录的用户对象
    """
    try:
        # 解码受保护的令牌
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        # 验证令牌数据
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError) as e:
        print(f"DEBUG: Auth failed. Token: {token[:20]}... Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无效的认证凭证",
        )
    
    # 从数据库获取用户详细信息
    user = db.query(User).filter(User.id == int(token_data.sub)).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户账户已禁用或不存在")
    return user
