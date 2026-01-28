from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.conversation import Conversation, ConversationMessage

def get_conversations(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(Conversation).filter(Conversation.user_id == user_id).order_by(Conversation.updated_at.desc()).offset(skip).limit(limit).all()

def get_conversation(db: Session, conversation_id: int):
    return db.query(Conversation).filter(Conversation.id == conversation_id).first()

def create_conversation(db: Session, user_id: int, title: str = "New Chat"):
    print(f"DEBUG: Creating conversation for user {user_id}, title: {title}")
    db_obj = Conversation(user_id=user_id, title=title)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_conversation(db: Session, conversation_id: int, title: Optional[str] = None, is_starred: Optional[bool] = None):
    db_obj = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if db_obj:
        if title is not None:
            db_obj.title = title
        if is_starred is not None:
            db_obj.is_starred = is_starred
        from sqlalchemy.sql import func
        db_obj.updated_at = func.now() # Force update timestamp
        db.commit()
        db.refresh(db_obj)
    return db_obj

def update_conversation_title(db: Session, conversation_id: int, title: str):
    return update_conversation(db, conversation_id=conversation_id, title=title)

def add_message_to_conversation(db: Session, conversation_id: int, role: str, content: str):
    db_obj = ConversationMessage(conversation_id=conversation_id, role=role, content=content)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_messages_by_conversation(db: Session, conversation_id: int):
    return db.query(ConversationMessage).filter(ConversationMessage.conversation_id == conversation_id).order_by(ConversationMessage.created_at.asc(), ConversationMessage.id.asc()).all()

def delete_conversation(db: Session, conversation_id: int):
    db_obj = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj

def get_message(db: Session, message_id: int):
    return db.query(ConversationMessage).filter(ConversationMessage.id == message_id).first()

def update_message_star(db: Session, message_id: int, is_starred: bool):
    db_obj = get_message(db, message_id=message_id)
    if db_obj:
        db_obj.is_starred = is_starred
        db.commit()
        db.refresh(db_obj)
    return db_obj
def get_starred_messages(db: Session, user_id: int):
    return db.query(ConversationMessage).join(Conversation).filter(Conversation.user_id == user_id, ConversationMessage.is_starred == True).all()

def update_message_compliance(db: Session, message_id: int, compliance_result: str):
    db_obj = get_message(db, message_id=message_id)
    if db_obj:
        db_obj.compliance_result = compliance_result
        db.commit()
        db.refresh(db_obj)
    return db_obj
