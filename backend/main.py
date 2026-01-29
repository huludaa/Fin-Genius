from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
from app.api.api_v1 import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

# 导入所有模型以向 Base.metadata 注册
from app.models.user import User
from app.models.prompt_template import PromptTemplate
from app.models.conversation import Conversation, ConversationMessage

# 自动创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.on_event("startup")
async def startup_event():
    print(f"DEBUG: App started. API_V1_STR={settings.API_V1_STR}")
    # Force print routes
    for route in app.routes:
        if hasattr(route, "path"):
            print(f"DEBUG: Route: {route.path}")

# 跨域配置 (CORS)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8008",
    "http://127.0.0.1:8008",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("GLOBAL EXCEPTION CAUGHT:")
    traceback.print_exc()
    response = JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()},
    )
    # 异常处理时的手动跨域头设置
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to Fin-Genius Backend"}
