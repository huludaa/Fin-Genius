from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.core.config import settings
from app.crud import crud_user
from app.schemas import user as user_schemas, token as token_schemas

# 创建 API 路由器
router = APIRouter()

@router.post("/token", response_model=token_schemas.Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    获取 OAuth2 兼容的访问令牌，供后续请求进行身份验证
    """
    # 调用 CRUD 层进行用户身份验证
    user = crud_user.authenticate_user(db, username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="用户名或密码错误")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="该账户已被禁用")
    
    # 设置令牌失效时间
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # 返回标准 OAuth2 Token 结构
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=user_schemas.User)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: user_schemas.UserCreate,
) -> Any:
    """
    新用户注册接口
    """
    # 检查用户名是否已被占用
    user = crud_user.get_user_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=400,
            detail="该用户名已存在",
        )
    # 创建新用户
    user = crud_user.create_user(db, user=user_in)
    return user
