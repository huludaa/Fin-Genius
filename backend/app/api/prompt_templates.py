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
    Retrieve prompt templates.
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
    Create new prompt template.
    """
    try:
        # Strict Admin check
        is_admin = getattr(current_user, 'is_superuser', False)
            
        # If not admin, force is_official to False (Ignore whatever user sent)
        if not is_admin:
            template_in.is_official = False
            
        template = crud_prompt_template.create_prompt_template(
            db, prompt_template=template_in, owner_id=current_user.id
        )
        return template
    except Exception as e:
        print(f"ERROR creating template: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{template_id}", response_model=template_schemas.PromptTemplate)
def update_prompt_template(
    *,
    db: Session = Depends(deps.get_db),
    template_id: int,
    template_in: template_schemas.PromptTemplateUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a prompt template.
    """
    template = crud_prompt_template.get_prompt_template(db, template_id=template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Prompt template not found")
        
    is_admin = getattr(current_user, 'is_superuser', False)
    
    # Permission check: Owner OR Admin
    if template.owner_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    # If not admin, prevent setting is_official to True
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
    Delete a prompt template.
    """
    template = crud_prompt_template.get_prompt_template(db, template_id=template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Prompt template not found")
        
    is_admin = getattr(current_user, 'is_superuser', False)

    # Only Owner or Admin can delete
    if template.owner_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    template = crud_prompt_template.remove_prompt_template(db, id=template_id)
    return template


