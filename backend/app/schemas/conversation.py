from pydantic import BaseModel # Pydantic 是数据验证和模型定义库（用于处理 JSON）
from typing import Optional
from datetime import datetime

# 消息基础模型
class MessageBase(BaseModel):
    role: str
    content: str

# 消息创建模型
class MessageCreate(MessageBase):
    pass

# 消息完整展示模型
class Message(MessageBase):
    id: int
    conversation_id: int
    is_starred: bool = False
    starred_at: Optional[datetime] = None
    compliance_result: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True # 把数据库模型映射到pydantic模型

# 会话基础模型
class ConversationBase(BaseModel):
    title: str
    is_starred: bool = False

# 会话创建模型
class ConversationCreate(ConversationBase):
    pass

# 会话更新模型
class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    is_starred: Optional[bool] = None

# 会话完整展示模型
class ConversationSchema(ConversationBase):
    id: int
    user_id: int
    is_starred: bool = False
    starred_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True # 把数据库模型映射到pydantic模型