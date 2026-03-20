# Fin-Genius (模方天地) 🚀

**Fin-Genius** 是一款全能型 AI 智能助手系统。它以“模板驱动”为核心，集成了先进的大语言模型（如通义千问、OpenAI 等），为用户提供多领域、全场景的智能对话与内容创作能力。通过自定义模板引擎与严苛的内容合规审查系统，模方旨在帮助各行各业的专业人士高效生成、优化各类工作内容，同时确保产出的合法合规。

---

## 核心功能 ✨

- **🛡️ 全场景合规审计**：内置强大的合规检查引擎，自动识别文案中的虚假夸大、欺骗性误导等违规表述，确保内容符合国家法律法规要求。
- **📋 提示词模板**：系统的核心亮点。支持官方预设与用户自定义模板，一键切换不同行业的专业角色，让 AI 生成更加精准。
- **💬 多模态 AI 对话**：支持文本、图片流式交互。
- **📄 全格式文档解析**：支持 PDF、Word 及图片的深度解析，可围绕文档进行智能问答。
- **📜 会话管理**：极致的流式响应体验，支持历史记录持久化及 AI 自动标题生成。

---

## 技术栈 🛠️

### 前端 (Next.js 14)
- **框架**: [Next.js](https://nextjs.org/) (Pages Router & TypeScript)
- **UI 组件**: [Ant Design 5](https://ant.design/)
- **状态管理**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **网络**: Axios + React Markdown (流式输出渲染)

### 后端 (FastAPI)
- **核心**: [FastAPI](https://fastapi.tiangolo.com/) (异步高性能 Web 框架)
- **数据库**: MySQL + SQLAlchemy (ORM)
- **AI 引擎**: 阿里云 DashScope (通义千问)、OpenAI、Google Vertex AI
- **认证**: OAuth2 + JWT (Jose)

---

## 快速开始 🏃‍♂️

### 1. 环境准备
确保您的系统中已安装 Python 3.10+ 和 Node.js 18+。

### 2. 后端配置
1. 进入 `backend` 目录，安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
2. 在 `backend` 目录下创建 `.env` 文件，参照以下配置：
   ```env
   # 数据库配置（根据实际情况修改！）
   DATABASE_URL=mysql+mysqlconnector://user:password@localhost/fin_genius

   # 密钥配置（根据实际情况修改！）
   SECRET_KEY=your_jwt_secret_key

   # AI 服务集成配置（根据实际情况修改！）
   AI_API_KEY=your_api_key_here
   AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
   AI_MODEL_NAME=qwen3.5-plus
   ```
3. 启动后端服务器：
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 3. 前端配置
1. 进入 `frontend` 目录，安装依赖：
   ```bash
   npm install
   ```
2. 启动开发服务器：
   ```bash
   npm run dev
   ```
3. 访问 [http://localhost:3000](http://localhost:3000) 即可开始使用。

---

## 目录结构 📂

```text
├── backend/            # FastAPI 后端源代码
│   ├── app/
│   │   ├── api/        # 接口路由 (AI, Auth, Conversations)
│   │   ├── core/       # 配置与全局常量
│   │   ├── crud/       # 数据库增删改查逻辑
│   │   ├── db/         # 数据库连接与配置
│   │   ├── models/     # 数据库 SQL 模型
│   │   ├── schemas/    # Pydantic 数据验证模型
│   │   └── services/   # 核心业务 (AI 生成、合规审计、文件解析)
│   └── main.py         # 系统入口
├── frontend/           # Next.js 前端源代码
│   ├── src/
│   │   ├── components/ # 基础组件 (Chat, Auth, Prompts)
│   │   ├── lib/        # 库配置 (Axios 拦截器等)
│   │   ├── store/      # Redux 状态管理 (Slices)
│   │   ├── pages/      # 业务页面 (Pages Router)
│   │   ├── styles/     # 全局 CSS 样式
│   │   └── theme/      # Ant Design 主题配置
└── README.md           # 本文档
```

---

## 许可证 📄

[MIT License](LICENSE)

---
**Fin-Genius** - 让金融更智能，让合规更简单。
