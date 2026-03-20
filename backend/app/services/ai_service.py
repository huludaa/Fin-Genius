from typing import List, AsyncGenerator
import time
from app.core.config import settings

class AIService:
    @staticmethod
    def _get_openai_client():
        from openai import AsyncOpenAI
        """创建并返回 OpenAI 兼容的客户端实例"""
        return AsyncOpenAI(
            api_key=settings.AI_API_KEY,
            base_url=settings.AI_BASE_URL
        )
    
    @staticmethod
    async def generate_text_stream(history: List[dict], prompt: str) -> AsyncGenerator[str, None]:
        if settings.AI_API_KEY:
            # 创建openai客户端
            client = AIService._get_openai_client()
            
            print(f"DEBUG: generate_text_stream called with prompt='{prompt}' history_len={len(history)}")
            
            # 处理多模态内容
            def format_content(text):
                if "data:image/" in text and ";base64," in text:
                    parts = []
                    # 简单分割以分离文本和图像
                    segments = text.split("data:image/")
                    # 文本部分
                    if segments[0].strip():
                        parts.append({"type": "text", "text": segments[0].strip()})
                    
                    for seg in segments[1:]:
                        # 图片base64编码部分
                        b64_part = "data:image/" + seg.split("---")[0].strip() # 前端在每个附件后面添加了"\n---\n"进行分割其他图片和文字，所以“---”是我们的分隔符
                        # 寻找真正的base64数据
                        actual_content = b64_part.split("\n")[0]
                        parts.append({"type": "image_url", "image_url": {"url": actual_content}})
                        
                        # 如果此段落中有剩余文本，也一并添加
                        remaining = seg.split("\n", 1) 
                        if len(remaining) > 1 and remaining[1].strip():
                            parts.append({"type": "text", "text": remaining[1].strip()})
                    return parts
                return text

            # 构造系统提示词
            system_prompt = {
                "role": "system",
                "content": (
                    "你是一个全能的 AI 助手。你可以协助用户在各行各业、各种场景下完成任务。\n"
                    "你的回答必须遵循以下准则：\n"
                    "符合法律与国家安全合规，禁止危害国家安全、分裂、恐怖主义、泄露机密、黄赌毒邪教、教唆犯罪，遵守网络安全法、数据安全法、个人信息保护法、生成式AI管理办法；价值观与公序良俗，坚持主流价值观、弘扬正能量、拒绝低俗、禁止各类歧视、保护未成年人；内容真实性与可靠性，不编造、不造谣、杜绝AI幻觉、不确定内容明示、专业内容风险提示；知识产权与商业合规，不侵权、不抄袭、不泄露商业秘密、不恶意竞争、广告明示；个人权益与隐私保护，不人身攻击、不人肉、不泄露隐私、不滥用数据、不骚扰诱导；特殊领域专项合规，金融不荐股不保收益、医疗不诊断不开药、法律不替代律师、教育不代写不作弊、政务不冒充官方；算法与技术合规，算法公平无偏见、训练数据合法安全、具备内容审核过滤、系统安全可控。"
                )
            }

            messages = [system_prompt]
            # 遍历历史消息
            for msg in history:
                role = msg.get("role")
                content = msg.get("content", "")
                if role not in ["user", "assistant", "system"]:
                    continue
                messages.append({"role": role, "content": format_content(content)})
            
            # 添加当前用户输入
            messages.append({"role": "user", "content": format_content(prompt)})
            
            print(f"DEBUG: Multi-modal messages ready for API Key: {settings.AI_API_KEY[:5]}...")

            try:
                stream = await client.chat.completions.create(
                    model=settings.AI_MODEL_NAME, # 使用 .env 中定义的模型
                    messages=messages,
                    stream=True # 流式输出
                )
                
                # 遍历流式输出，chunk是流式输出的块
                async for chunk in stream:
                    # 提取内容,增量模式用的是choices[0].delta.content,而同步模式用的是choices[0].message.content
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content # 吐字（yield类似return，但它是可以多次返回的，return是一次性返回）

            except Exception as e:
                yield f"Error calling AI API: {str(e)}"
        else:
            # 兜底逻辑
            full_text = f"请在 .env 中配置 AI_API_KEY 以对接大模型"
            
            for word in full_text.split(" "): #分割空格是为了模拟流式输出一块块吐
                 yield f"{word} "
                 time.sleep(0.05) 

    @staticmethod
    async def check_compliance(text: str) -> dict:
        import json
        if settings.AI_API_KEY:
            client = AIService._get_openai_client()
            
            prompt = f"""你是一位资深的 AI 内容合规审查专家。请对以下文案进行严谨的合规性审查。
            
审查标准：符合法律与国家安全合规，禁止危害国家安全、分裂、恐怖主义、泄露机密、黄赌毒邪教、教唆犯罪，遵守网络安全法、数据安全法、个人信息保护法、生成式AI管理办法；价值观与公序良俗，坚持主流价值观、弘扬正能量、拒绝低俗、禁止各类歧视、保护未成年人；内容真实性与可靠性，不编造、不造谣、杜绝AI幻觉、不确定内容明示、专业内容风险提示；知识产权与商业合规，不侵权、不抄袭、不泄露商业秘密、不恶意竞争、广告明示；个人权益与隐私保护，不人身攻击、不人肉、不泄露隐私、不滥用数据、不骚扰诱导；特殊领域专项合规，金融不荐股不保收益、医疗不诊断不开药、法律不替代律师、教育不代写不作弊、政务不冒充官方；算法与技术合规，算法公平无偏见、训练数据合法安全、具备内容审核过滤、系统安全可控。

待审查文案：
「{text}」

请直接以 JSON 格式输出结果，格式要求如下：
{{
    "is_compliant": boolean (合规为 true，违规为 false),
    "reason": "简明扼要的违规原因说明或合规理由",
    "suggestion": "一条简短的修改建议"
}}
注意：只需返回 JSON，不要包含任何 Markdown 格式符号。"""

            try:
                response = await client.chat.completions.create(
                    model=settings.AI_MODEL_NAME, 
                    messages=[{"role": "system", "content": "你是一个严谨且专业的 AI 内容合规助手。"},
                             {"role": "user", "content": prompt}],
                    temperature=0.1
                )
                
                content = response.choices[0].message.content.strip()
                # 清洗可能存在的 markdown 块（代码块）
                if content.startswith("```"):
                    # split("\n", 1)[1] : 表示以换行符为分隔符，最多分割1次, [1]取结果的第二部分
                    content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip() # rsplit是从右边开始分割
                if content.startswith("json"):
                    content = content[4:].strip()
                
                return json.loads(content)
            except Exception as e:
                print(f"AI 合规检测异常: {e}")
                return {
                    "is_compliant": False,
                    "reason": f"合规检测服务暂时不可用 (Error: {str(e)})",
                    "suggestion": "请稍后再试"
                }
        else:
            return {
                "is_compliant": False,
                "reason": "合规检测服务未配置 (Missing API Key)",
                "suggestion": "请联系管理员配置 AI_API_KEY"
            }
    
    @staticmethod
    async def generate_title(first_message: str) -> str:
        if settings.AI_API_KEY: 
            client = AIService._get_openai_client()
            
            prompt = f"请生成一个非常简短的标题（最多8个汉字），用于描述以该消息开头的对话：'{first_message}'. 只返回标题文本，不要包含引号或前缀。"
            
            try:
                response = await client.chat.completions.create(
                    model=settings.AI_MODEL_NAME, 
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=20
                )
                title = response.choices[0].message.content.strip()
                return title[:8]
            except Exception as e:
                print(f"Error generating title: {e}")
                return first_message[:8]
        else:
            return first_message[:8]

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
                doc = Document(io.BytesIO(file_bytes)) # BytesIO(file_bytes)将字节流转换为文件流
                parts = [p.text for p in doc.paragraphs] # 提取所有段落的文本
                content = "\n".join(parts)
            elif filename.endswith('.pdf'):
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(file_bytes))
                content = "\n".join([page.extract_text() for page in reader.pages]) # 提取所有页面的文本
            elif filename.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                import base64
                encoded = base64.b64encode(file_bytes).decode('utf-8') # 将字节流编码为base64编码
                mime = "image/png" # 默认图片类型为png
                if filename.endswith(('.jpg', '.jpeg')): mime = "image/jpeg"
                elif filename.endswith('.gif'): mime = "image/gif"
                elif filename.endswith('.webp'): mime = "image/webp"
                return f"data:{mime};base64,{encoded}"
            else:
                # 默认按文本 (utf-8) 处理
                content = file_bytes.decode('utf-8', errors='ignore')
            
            MAX_CHARS = 100000 
            if len(content) > MAX_CHARS:
                content = content[:MAX_CHARS] + "\n\n[内容过长，已被自动截断...]"
                
            return content
        except Exception as e:
            print(f"Error parsing file {filename}: {e}")
            return f"[错误：解析文件 {filename} 失败]"

ai_service = AIService()
