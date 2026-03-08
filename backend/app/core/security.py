from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# 创建密码管理环境：指定使用 pbkdf2_sha256 算法，并能自动处理旧算法的废弃
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
# 定义 JWT 签名算法：使用 HS256（一种常用的对称加密算法）
ALGORITHM = "HS256"

# 创建访问令牌
def create_access_token(
    #subject 是要存的数据（通常是用户ID），expires_delta 是可选的自定义过期时间
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    # 准备要加密的内容：exp 是过期时刻，sub 是这个令牌的持有者（ID）
    to_encode = {"exp": expire, "sub": str(subject)}
    # 使用 HS256 算法和密钥，将内容加密成 JWT
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 验证密码
def verify_password(plain_password: str, hashed_password: str) -> bool:
    # 验证明文密码和哈希密码是否匹配
    return pwd_context.verify(plain_password, hashed_password)

# 获取密码的哈希值
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
