from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_conversation
from app.models.user import User
from app.schemas import conversation as conversation_schemas
import traceback
from app.services.ai_service import ai_service

router = APIRouter()


# 异步生成标题的后台任务
async def generate_and_update_title(conversation_id: int, message_content: str):
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        title = await ai_service.generate_title(message_content)
        crud_conversation.update_conversation_title(db, conversation_id=conversation_id, title=title)
    except Exception as e:
        print(f"Background title generation error: {e}")
    finally:
        db.close()


# 获取会话列表
@router.get("/", response_model=List[conversation_schemas.ConversationSchema])
def read_conversations(
    db: Session = Depends(deps.get_db), # 连接数据库
    skip: int = 0, # 跳过前多少条
    limit: int = 100, # 取前多少条
    current_user: User = Depends(deps.get_current_user), # 获取当前用户
) -> Any:
    try:
        return crud_conversation.get_conversations(db, user_id=current_user.id, skip=skip, limit=limit) 
    except Exception as e:
        print(f"Error reading conversation list: {e}")
        raise HTTPException(status_code=500, detail="获取会话列表失败")

# 创建会话
@router.post("/", response_model=conversation_schemas.ConversationSchema)
def create_conversation(
    *,
    db: Session = Depends(deps.get_db),
    conversation_in: conversation_schemas.ConversationCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    try:
        return crud_conversation.create_conversation(db, user_id=current_user.id, title=conversation_in.title)
    except Exception as e:
        print(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail="创建会话失败")

# 获取会话中的消息
@router.get("/{id}/messages", response_model=List[conversation_schemas.Message])
def read_messages(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    conversation = crud_conversation.get_conversation(db, conversation_id=id)
    if not conversation or conversation.user_id != current_user.id: # 检查对话所有权
        raise HTTPException(status_code=404, detail="会话不存在或无权限访问")
    return crud_conversation.get_messages_by_conversation(db, conversation_id=id)

# 添加消息
@router.post("/{id}/messages", response_model=conversation_schemas.Message)
async def add_message(
    id: int,
    *,
    db: Session = Depends(deps.get_db),
    message_in: conversation_schemas.MessageCreate,
    current_user: User = Depends(deps.get_current_user),
    background_tasks: BackgroundTasks,
) -> Any:
    try:
        conversation = crud_conversation.get_conversation(db, conversation_id=id)
        if not conversation or conversation.user_id != current_user.id: # 检查对话所有权
            raise HTTPException(status_code=404, detail="会话不存在或无权限访问")
        
        # 如果这是首条用户消息，在后台自动为对话生成标题       
        if message_in.role == "user":
            messages = crud_conversation.get_messages_by_conversation(db, conversation_id=id)
            if len(messages) == 0:
                background_tasks.add_task(generate_and_update_title, id, message_in.content)
        
        # 更新对话的最后活跃时间 (updated_at)

        crud_conversation.update_conversation(db, conversation_id=id)
        # 添加消息
        return crud_conversation.add_message_to_conversation(db, conversation_id=id, role=message_in.role, content=message_in.content)
    except Exception as e:
        print(f"Error adding message: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="添加消息失败")

# 更新对话
@router.patch("/{id}", response_model=conversation_schemas.ConversationSchema)
def update_conversation(
    id: int,
    *,
    db: Session = Depends(deps.get_db),
    conversation_in: conversation_schemas.ConversationUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    conversation = crud_conversation.get_conversation(db, conversation_id=id)
    if not conversation or conversation.user_id != current_user.id: # 检查对话所有权
        raise HTTPException(status_code=404, detail="会话不存在或无权限访问")
    return crud_conversation.update_conversation(db, conversation_id=id, title=conversation_in.title, is_starred=conversation_in.is_starred)

# 删除对话
@router.delete("/{id}")
def delete_conversation(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    conversation = crud_conversation.get_conversation(db, conversation_id=id)
    if not conversation or conversation.user_id != current_user.id: # 检查对话所有权
        raise HTTPException(status_code=404, detail="会话不存在或无权限访问")
    crud_conversation.delete_conversation(db, conversation_id=id)
    return {"status": "ok"}

# 收藏/取消收藏消息
@router.patch("/messages/{message_id}", response_model=conversation_schemas.Message)
def toggle_message_star(
    message_id: int,
    *,
    db: Session = Depends(deps.get_db),
    is_starred: bool,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """ 局部更新：实现营销内容（单条消息）的一键收藏或取消 """
    message = crud_conversation.get_message(db, message_id=message_id)
    if not message: # 检查消息是否存在
        raise HTTPException(status_code=404, detail="消息不存在")
    
    # 检查对话所有权：利用 deps 依赖项确保用户只能收藏属于自己的消息（数据隔离）
    conversation = crud_conversation.get_conversation(db, conversation_id=message.conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="消息不存在或无权限操作")
        
    # 调用 CRUD 层更新 is_starred 状态位并记录 starred_at 时间
    return crud_conversation.update_message_star(db, message_id=message_id, is_starred=is_starred)

# 获取收藏的消息
@router.get("/starred-messages", response_model=List[conversation_schemas.Message])
def read_starred_messages(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return crud_conversation.get_starred_messages(db, user_id=current_user.id)
