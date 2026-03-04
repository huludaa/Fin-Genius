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

# 创建 FastAPI 应用
app = FastAPI(
    title=settings.PROJECT_NAME, # 设置 Swagger 自动文档标题
    openapi_url=f"{settings.API_V1_STR}/openapi.json" # 设置 Swagger 自动文档接口地址
)

# 启动事件
@app.on_event("startup")
async def startup_event():
    print(f"DEBUG: App started. API_V1_STR={settings.API_V1_STR}")
    # 打印路由
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
# 注册跨域中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # 允许的源
    allow_credentials=True,# 允许携带 cookies
    allow_methods=["*"], # 允许所有方法
    allow_headers=["*"], # 允许所有头
)

# 注册全局异常处理器
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("Global exception caught:")
    traceback.print_exc() # 打印异常信息
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

# 注册 API 路由
app.include_router(api_router, prefix=settings.API_V1_STR)

# 根路由
@app.get("/")
def read_root():
    return {"message": "Welcome to Fin-Genius Backend"}
