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
            
            # 准备消息列表：历史记录 + 当前提示词
            def format_content(text):
                if "data:image/" in text and ";base64," in text:
                    # 针对视觉模型的多模态内容处理
                    parts = []
                    # 简单分割以分离文本和图像
                    segments = text.split("data:image/")
                    if segments[0].strip():
                        parts.append({"type": "text", "text": segments[0].strip()})
                    
                    for seg in segments[1:]:
                        b64_part = "data:image/" + seg.split("---")[0].strip() # 假设这是我们的分隔符
                        # 更好的检测：寻找实际的 base64 结尾
                        actual_content = b64_part.split("\n")[0] # base64 数据行
                        parts.append({"type": "image_url", "image_url": {"url": actual_content}})
                        
                        # 如果此段落中有剩余文本，也一并添加
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
            # 模拟/兜底逻辑（如果未配置 API Key）
            full_text = f"已模拟 AI 回复: {prompt}。（请在 .env 中配置 DASHSCOPE_API_KEY 以对接通义千问）\n\n"
            full_text += "根据您的输入，以下是结构化建议：\n"
            full_text += "- 建议 1: 与金融方案的相关性。\n"
            full_text += "- 建议 2: 市场反馈趋势。\n"
            
            for word in full_text.split(" "):
                 yield f"{word} "
                 time.sleep(0.05) 

    @staticmethod
    async def check_compliance(text: str) -> dict:
        import json
        if settings.DASHSCOPE_API_KEY:
            client = AIService._get_openai_client()
            
            prompt = f"""你是一位资深的金融营销合规专家。请对以下营销文案进行严谨的合规性审查。

审查标准：
1. 禁止明示或暗示“保本”、“无风险”、“保证收益”、“稳赚不赔”、“绝对安全”等类似表述（包括变体，如“百分百收益”）。
2. 禁止虚假夸大产品收益或过往业绩。
3. 检查是否有明显的误导性词汇。

待审查文案：
「{text}」

请直接以 JSON 格式输出结果，格式要求如下：
{{
    "is_compliant": boolean (合规为 true，违规为 false),
    "reason": "简明扼要的违规原因说明或合规理由",
    "suggestions": ["修改建议1", "修改建议2"]
}}
注意：只需返回 JSON，不要包含任何 Markdown 格式符号。"""

            try:
                response = await client.chat.completions.create(
                    model="qwen-plus",
                    messages=[{"role": "system", "content": "你是一个严格的金融合规助手。"},
                             {"role": "user", "content": prompt}],
                    temperature=0.1 # 降低随机性，保证判断一致性
                )
                
                content = response.choices[0].message.content.strip()
                # 清洗可能存在的 markdown 块
                if content.startswith("```"):
                    content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
                if content.startswith("json"):
                    content = content[4:].strip()
                
                return json.loads(content)
            except Exception as e:
                print(f"AI 合规检测异常: {e}")
                return {
                    "is_compliant": False,
                    "reason": f"合规检测服务暂时不可用 (Error: {str(e)})",
                    "suggestions": ["请稍后再试"]
                }
        else:
            return {
                "is_compliant": False,
                "reason": "合规检测服务未配置 (Missing API Key)",
                "suggestions": ["请联系管理员配置 DASHSCOPE_API_KEY"]
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
                # 如果 AI 返回了多余的前缀（如 "Title:"），进行清理
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
        将上传的文件内容（txt, docx, pdf 等）解析为纯文本。
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
                # 默认按文本 (utf-8) 处理
                content = file_bytes.decode('utf-8', errors='ignore')
            
            # 自动截断以防超过上下文限制（约 10 万字符）
            MAX_CHARS = 100000 
            if len(content) > MAX_CHARS:
                content = content[:MAX_CHARS] + "\n\n[内容过长，已被自动截断...]"
                
            return content
        except Exception as e:
            print(f"Error parsing file {filename}: {e}")
            return f"[Error parsing file {filename}]"

ai_service = AIService()
