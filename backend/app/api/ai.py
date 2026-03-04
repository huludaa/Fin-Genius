from typing import Any, List, Optional
import json
from fastapi import APIRouter, Depends, Body, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api import deps
from app.services.ai_service import ai_service
from app.models.user import User
from app.crud import crud_conversation

router = APIRouter()

@router.post("/generate-content")
async def generate_content(
    *,
    history: List[dict] = Body(...),
    prompt: str = Body(...),
    current_user: User = Depends(deps.get_current_user), # 获取当前用户信息，检查有没有带合法的Token
) -> StreamingResponse: # 返回流式响应类型
    return StreamingResponse(ai_service.generate_text_stream(history, prompt), media_type="text/plain")

@router.post("/compliance-check")
async def compliance_check(
    *,
    text: str = Body(..., embed=True),# embed=True 把参数封装成json
    message_id: Optional[int] = Body(None),
    db: Session = Depends(deps.get_db), # 获取数据库连接
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # 如果有消息ID，先检查数据库中是否有合规性检查结果
    if message_id:
        msg = crud_conversation.get_message(db, message_id=message_id)
        # 如果有合规性检查结果，直接返回
        if msg and msg.compliance_result:
            try:
                return json.loads(msg.compliance_result)
            except Exception:
                pass

    # 调用合规性检查服务
    result = await ai_service.check_compliance(text)
    
    # 如果有消息ID，更新数据库中的合规性检查结果
    if message_id:
        crud_conversation.update_message_compliance(db, message_id=message_id, compliance_result=json.dumps(result))
        
    return result

@router.post("/parse-file")
async def parse_file(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    content = ai_service.parse_uploaded_file(file)
    return {"content": content}
