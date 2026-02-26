from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_conversation
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime
import traceback

router = APIRouter()

class MessageBase(BaseModel):
    role: str
    content: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    conversation_id: int
    is_starred: bool = False
    starred_at: Optional[datetime] = None
    compliance_result: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    title: str
    is_starred: bool = False

class ConversationCreate(ConversationBase):
    pass

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    is_starred: Optional[bool] = None

class ConversationSchema(ConversationBase):
    id: int
    user_id: int
    is_starred: bool = False
    starred_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ConversationSchema])
def read_conversations(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    try:
        return crud_conversation.get_conversations(db, user_id=current_user.id, skip=skip, limit=limit)
    except Exception as e:
        print(f"获取会话列表出错: {e}")
        raise HTTPException(status_code=500, detail="获取会话列表失败")

@router.post("/", response_model=ConversationSchema)
def create_conversation(
    *,
    db: Session = Depends(deps.get_db),
    conversation_in: ConversationCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    try:
        return crud_conversation.create_conversation(db, user_id=current_user.id, title=conversation_in.title)
    except Exception as e:
        print(f"创建会话出错: {e}")
        raise HTTPException(status_code=500, detail="创建会话失败")

@router.get("/{id}/messages", response_model=List[Message])
def read_messages(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    conversation = crud_conversation.get_conversation(db, conversation_id=id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="未找到该会话")
    return crud_conversation.get_messages_by_conversation(db, conversation_id=id)

@router.post("/{id}/messages", response_model=Message)
async def add_message(
    id: int,
    *,
    db: Session = Depends(deps.get_db),
    message_in: MessageCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    try:
        conversation = crud_conversation.get_conversation(db, conversation_id=id)
        if not conversation or conversation.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="未找到该会话")
        
        # 如果这是首条用户消息，使用 AI 自动为对话生成标题
        if message_in.role == "user":
            messages = crud_conversation.get_messages_by_conversation(db, conversation_id=id)
            if len(messages) == 0:
                from app.services.ai_service import ai_service
                title = await ai_service.generate_title(message_in.content)
                crud_conversation.update_conversation_title(db, conversation_id=id, title=title)
        
        # 更新对话的最后活跃时间 (updated_at)
        crud_conversation.update_conversation(db, conversation_id=id)
                
        return crud_conversation.add_message_to_conversation(db, conversation_id=id, role=message_in.role, content=message_in.content)
    except Exception as e:
        print(f"添加消息出错: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="添加消息失败")

@router.patch("/{id}", response_model=ConversationSchema)
def update_conversation(
    id: int,
    *,
    db: Session = Depends(deps.get_db),
    conversation_in: ConversationUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    conversation = crud_conversation.get_conversation(db, conversation_id=id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="未找到该会话")
    return crud_conversation.update_conversation(db, conversation_id=id, title=conversation_in.title, is_starred=conversation_in.is_starred)

@router.delete("/{id}")
def delete_conversation(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    conversation = crud_conversation.get_conversation(db, conversation_id=id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="未找到该会话")
    crud_conversation.delete_conversation(db, conversation_id=id)
    return {"status": "ok"}

@router.patch("/messages/{message_id}", response_model=Message)
def toggle_message_star(
    message_id: int,
    *,
    db: Session = Depends(deps.get_db),
    is_starred: bool,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """ 局部更新：实现营销内容（单条消息）的一键收藏或取消 """
    message = crud_conversation.get_message(db, message_id=message_id)
    if not message:
        raise HTTPException(status_code=404, detail="消息不存在")
    
    # 检查对话所有权：利用 deps 依赖项确保用户只能收藏属于自己的消息（数据隔离）
    conversation = crud_conversation.get_conversation(db, conversation_id=message.conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="消息不存在或无权限操作")
        
    # 调用 CRUD 层更新 is_starred 状态位并记录 starred_at 时间
    return crud_conversation.update_message_star(db, message_id=message_id, is_starred=is_starred)

@router.get("/starred-messages", response_model=List[Message])
def read_starred_messages(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return crud_conversation.get_starred_messages(db, user_id=current_user.id)
