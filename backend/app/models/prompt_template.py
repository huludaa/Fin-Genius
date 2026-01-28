from sqlalchemy import Column, ForeignKey, Integer, String, Text, JSON, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class PromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    template_name = Column(String(255), index=True)
    product_name = Column(String(255))
    target_audience = Column(Text)
    channels = Column(JSON)
    tone_of_voice = Column(String(255))
    core_selling_points = Column(Text)
    description = Column(Text)
    variables = Column(JSON)
    template_content = Column(Text)
    is_official = Column(Boolean(), default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="prompt_templates")
