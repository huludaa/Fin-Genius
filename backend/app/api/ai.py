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
    current_user: User = Depends(deps.get_current_user),
) -> StreamingResponse:
    return StreamingResponse(ai_service.generate_text_stream(history, prompt), media_type="text/plain")

@router.post("/compliance-check")
async def compliance_check(
    *,
    text: str = Body(..., embed=True),
    message_id: Optional[int] = Body(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if message_id:
        msg = crud_conversation.get_message(db, message_id=message_id)
        if msg and msg.compliance_result:
            try:
                return json.loads(msg.compliance_result)
            except Exception:
                pass
            
    result = await ai_service.check_compliance(text)
    
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
