from app.db.base import Base

# 导入所有模型，以便 Base.metadata 能“看见”它们
from app.models.user import User
from app.models.prompt_template import PromptTemplate
from app.models.conversation import Conversation, ConversationMessage
