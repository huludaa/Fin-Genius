from sqlalchemy.orm import Session
from app.models.prompt_template import PromptTemplate
from app.schemas.prompt_template import PromptTemplateCreate, PromptTemplateUpdate
from fastapi.encoders import jsonable_encoder

def get_prompt_template(db: Session, template_id: int):
    return db.query(PromptTemplate).filter(PromptTemplate.id == template_id).first()

def get_multi_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    from sqlalchemy import or_
    return db.query(PromptTemplate).filter(
        or_(
            PromptTemplate.is_official == True,
            PromptTemplate.owner_id == owner_id
        )
    ).offset(skip).limit(limit).all()

def create_prompt_template(db: Session, prompt_template: PromptTemplateCreate, owner_id: int):
    obj_in_data = jsonable_encoder(prompt_template)
    db_obj = PromptTemplate(**obj_in_data, owner_id=owner_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_prompt_template(db: Session, db_obj: PromptTemplate, obj_in: PromptTemplateUpdate):
    obj_data = jsonable_encoder(db_obj)
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)
    for field in obj_data:
        if field in update_data:
            setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_prompt_template(db: Session, id: int):
    obj = db.query(PromptTemplate).get(id)
    db.delete(obj)
    db.commit()
    return obj
