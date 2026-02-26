from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas import prompt_template as template_schemas
from app.crud import crud_prompt_template
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[template_schemas.PromptTemplate])
def read_prompt_templates(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    获取提示词模板列表
    """
    templates = crud_prompt_template.get_multi_by_owner(
        db, owner_id=current_user.id, skip=skip, limit=limit
    )
    return templates

@router.post("/", response_model=template_schemas.PromptTemplate)
def create_prompt_template(
    *,
    db: Session = Depends(deps.get_db),
    template_in: template_schemas.PromptTemplateCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    创建新的提示词模板
    """
    try:
        # 严格的管理员权限校验
        is_admin = getattr(current_user, 'is_superuser', False)
            
        # 如果不是管理员，强制将 is_official 设为 False（忽略用户发送的值）
        if not is_admin:
            template_in.is_official = False
            
        # 数据库持久化：关联当前所有者 ID
        template = crud_prompt_template.create_prompt_template(
            db, prompt_template=template_in, owner_id=current_user.id
        )
        return template
    except Exception as e:
        print(f"创建模板出错: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="模板创建失败")

@router.put("/{template_id}", response_model=template_schemas.PromptTemplate)
def update_prompt_template(
    *,
    db: Session = Depends(deps.get_db),
    template_id: int,
    template_in: template_schemas.PromptTemplateUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    更新现有提示词模板
    """
    template = crud_prompt_template.get_prompt_template(db, template_id=template_id)
    if not template:
        raise HTTPException(status_code=404, detail="模板未找到")
        
    is_admin = getattr(current_user, 'is_superuser', False)
    
    # 权限校验：仅所有者或管理员可修改
    if template.owner_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="权限不足")
        
    # 如果不是管理员，防止用户将普通模板篡改为官方模板
    if not is_admin:
        template_in.is_official = False

    template = crud_prompt_template.update_prompt_template(
        db, db_obj=template, obj_in=template_in
    )
    return template

@router.delete("/{template_id}", response_model=template_schemas.PromptTemplate)
def delete_prompt_template(
    *,
    db: Session = Depends(deps.get_db),
    template_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    删除提示词模板
    """
    template = crud_prompt_template.get_prompt_template(db, template_id=template_id)
    if not template:
        raise HTTPException(status_code=404, detail="模板未找到")
        
    is_admin = getattr(current_user, 'is_superuser', False)

    # 仅所有者或管理员可删除
    if template.owner_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="权限不足")
        
    template = crud_prompt_template.remove_prompt_template(db, id=template_id)
    return template


