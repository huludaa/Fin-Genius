from sqlalchemy.orm import Session
from app.models.prompt_template import PromptTemplate
from app.schemas.prompt_template import PromptTemplateCreate, PromptTemplateUpdate
from fastapi.encoders import jsonable_encoder

# 获取单个模板
def get_prompt_template(db: Session, template_id: int):
    return db.query(PromptTemplate).filter(PromptTemplate.id == template_id).first()

# 获取所有官方模板和当前用户创建的模板
def get_multi_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    from sqlalchemy import or_
    return db.query(PromptTemplate).filter(
        or_(
            PromptTemplate.is_official == True,
            PromptTemplate.owner_id == owner_id
        )
    ).offset(skip).limit(limit).all() # offset(skip)：跳过前 skip 个结果。这对应前端翻页时的“我已经看完前两页了”。limit(limit)：只拿 limit 个。防止一次性吐出 10w 条数据把服务器撑爆。

def create_prompt_template(db: Session, prompt_template: PromptTemplateCreate, owner_id: int):
    obj_in_data = jsonable_encoder(prompt_template) # jsonable_encoder：把数据转换成 JSON 兼容的格式
    db_obj = PromptTemplate(**obj_in_data, owner_id=owner_id) # **obj_in_data中的 ** 代表字典解包的意思
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_prompt_template(db: Session, db_obj: PromptTemplate, obj_in: PromptTemplateUpdate):
    obj_data = jsonable_encoder(db_obj)
    if isinstance(obj_in, dict): # isinstance用来判断一个对象是否属于指定的数据类型 / 类，返回布尔值（True/False）
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True) # exclude_unset=True 是 Pydantic 模型的核心参数，主要用在模型转字典 / JSON时。
    for field in obj_data:
        if field in update_data:
            setattr(db_obj, field, update_data[field]) # setattr(对象, "属性名", 属性值)，动态给对象设置 / 修改属性值
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_prompt_template(db: Session, id: int):
    obj = db.query(PromptTemplate).get(id)
    db.delete(obj)
    db.commit()
    return obj
