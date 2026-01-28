from typing import List, AsyncGenerator
import time
from app.core.config import settings

class AIService:
    @staticmethod
    def _get_openai_client():
        """创建并返回 OpenAI 客户端实例"""
        from openai import AsyncOpenAI
        return AsyncOpenAI(
            api_key=settings.DASHSCOPE_API_KEY,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
        )
    
    @staticmethod
    async def generate_text_stream(history: List[dict], prompt: str) -> AsyncGenerator[str, None]:
        if settings.DASHSCOPE_API_KEY:
            client = AIService._get_openai_client()
            
            print(f"DEBUG: generate_text_stream called with prompt='{prompt}' history_len={len(history)}")
            
            # Prepare messages: history + current prompt
            def format_content(text):
                if "data:image/" in text and ";base64," in text:
                    # Multimodal content for VL models
                    parts = []
                    # Simple split to separate text and images
                    segments = text.split("data:image/")
                    if segments[0].strip():
                        parts.append({"type": "text", "text": segments[0].strip()})
                    
                    for seg in segments[1:]:
                        b64_part = "data:image/" + seg.split("---")[0].strip() # Assuming our separator
                        # Better detection: look for actual base64 end
                        actual_content = b64_part.split("\n")[0] # The base64 line
                        parts.append({"type": "image_url", "image_url": {"url": actual_content}})
                        
                        # Add remaining text in this segment if any
                        remaining = seg.split("\n", 1)
                        if len(remaining) > 1 and remaining[1].strip():
                            parts.append({"type": "text", "text": remaining[1].strip()})
                    return parts
                return text

            messages = []
            for msg in history:
                role = msg.get("role")
                content = msg.get("content", "")
                if role not in ["user", "assistant", "system"]:
                    continue
                messages.append({"role": role, "content": format_content(content)})
            
            messages.append({"role": "user", "content": format_content(prompt)})
            
            print(f"DEBUG: Multi-modal messages ready for {settings.DASHSCOPE_API_KEY[:5]}...")

            try:
                stream = await client.chat.completions.create(
                    model="qwen-vl-plus", # 阿里云官方推荐的视觉模型 ID
                    messages=messages,
                    stream=True
                )
                
                async for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content

            except Exception as e:
                yield f"Error calling Qwen API: {str(e)}"
        else:
            # Simulation / Fallback if no key
            full_text = f"Simulated AI response for: {prompt}. (Configure DASHSCOPE_API_KEY in .env to use Qwen)\n\n"
            full_text += "Based on your input, here is a structured suggestion:\n"
            full_text += "- Point 1: Relevance to finance.\n"
            full_text += "- Point 2: Market trends.\n"
            
            for word in full_text.split(" "):
                 yield f"{word} "
                 time.sleep(0.05) 

    @staticmethod
    def check_compliance(text: str) -> dict:
        # 扩展的风险关键词列表
        risk_keywords = [
            "保证收益", "保本", "零风险", "稳赚不赔",
            "无风险", "100%收益", "绝对安全", "承诺收益",
            "保底", "稳赚", "只赚不赔", "高收益无风险"
        ]
        found_risks = [k for k in risk_keywords if k in text]
        
        if found_risks:
            return {
                "is_compliant": False,
                "reason": f"文案包含敏感金融承诺词汇: {', '.join(found_risks)}。根据监管要求，营销文案不得明示或暗示保本保收益。",
                "suggestions": ["建议删除‘保本’等表述", "增加‘风险自担’等合规提示词"]
            }
            
        return {
            "is_compliant": True,
            "reason": "内容符合金融营销通用合规准则，未发现明显违规承诺词语。",
            "suggestions": []
        }
    
    @staticmethod
    async def generate_title(first_message: str) -> str:
        if settings.DASHSCOPE_API_KEY:
            client = AIService._get_openai_client()
            
            prompt = f"Please generate a very short, concise title (MAX 15 characters) for a conversation that starts with this message: '{first_message}'. Respond ONLY with the title text, no quotes or prefix."
            
            try:
                response = await client.chat.completions.create(
                    model="qwen3-vl-plus",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=20
                )
                title = response.choices[0].message.content.strip()
                # Clean up if AI was chatty
                if title.lower().startswith("title:"):
                    title = title[6:].strip()
                return title[:15]
            except Exception as e:
                print(f"Error generating title: {e}")
                return first_message[:15]
        else:
            return first_message[:15]

    @staticmethod
    def parse_uploaded_file(file) -> str:
        """
        Parses uploaded file content (txt, docx, etc.) into plain text.
        """
        filename = file.filename.lower()
        content = ""
        
        try:
            file_bytes = file.file.read()
            import io
            
            if filename.endswith('.docx'):
                from docx import Document
                doc = Document(io.BytesIO(file_bytes))
                parts = [p.text for p in doc.paragraphs]
                content = "\n".join(parts)
            elif filename.endswith('.pdf'):
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(file_bytes))
                content = "\n".join([page.extract_text() for page in reader.pages])
            elif filename.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                import base64
                encoded = base64.b64encode(file_bytes).decode('utf-8')
                mime = "image/png"
                if filename.endswith(('.jpg', '.jpeg')): mime = "image/jpeg"
                elif filename.endswith('.gif'): mime = "image/gif"
                elif filename.endswith('.webp'): mime = "image/webp"
                return f"data:{mime};base64,{encoded}"
            else:
                # Default as text (utf-8)
                content = file_bytes.decode('utf-8', errors='ignore')
            
            # Prevent 128k limit error by truncating
            MAX_CHARS = 100000 
            if len(content) > MAX_CHARS:
                content = content[:MAX_CHARS] + "\n\n[内容过长，已被自动截断...]"
                
            return content
        except Exception as e:
            print(f"Error parsing file {filename}: {e}")
            return f"[Error parsing file {filename}]"

ai_service = AIService()
