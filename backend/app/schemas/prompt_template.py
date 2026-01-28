from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class PromptTemplateBase(BaseModel):
    template_name: str
    product_name: Optional[str] = None
    target_audience: Optional[str] = None
    channels: Optional[List[str]] = None
    tone_of_voice: Optional[str] = None
    core_selling_points: Optional[str] = None
    description: Optional[str] = None
    variables: Optional[List[dict]] = None
    template_content: Optional[str] = None
    is_official: Optional[bool] = False

class PromptTemplateCreate(PromptTemplateBase):
    pass

class PromptTemplateUpdate(PromptTemplateBase):
    template_name: Optional[str] = None
    product_name: Optional[str] = None
    target_audience: Optional[str] = None
    channels: Optional[List[str]] = None
    tone_of_voice: Optional[str] = None
    core_selling_points: Optional[str] = None
    description: Optional[str] = None
    variables: Optional[List[dict]] = None
    template_content: Optional[str] = None
    is_official: Optional[bool] = None

class PromptTemplateInDBBase(PromptTemplateBase):
    id: int
    owner_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PromptTemplate(PromptTemplateInDBBase):
    pass
