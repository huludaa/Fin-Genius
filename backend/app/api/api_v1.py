from fastapi import APIRouter
from app.api import auth, users, prompt_templates, ai, conversations

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(prompt_templates.router, prefix="/prompt-templates", tags=["prompt-templates"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
