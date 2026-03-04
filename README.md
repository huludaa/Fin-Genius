# Fin-Genius (金融极客) 🚀

**Fin-Genius** 是一款专为金融行业打造的智能助理系统。它不仅提供基于大模型（通义千问、Vertex AI 等）的多轮对话能力，更核心的是其内置的**金融合规性审查**引擎，旨在帮助金融从业者快速生成、审查并优化营销文案，确保业务合规。

---

## 核心功能 ✨

- **🛡️ 金融合规审计**：自动识别文案中的“保本”、“无风险”、“保证收益”等违规表述，提供合规建议。
- **💬 多模态 AI 对话**：支持文本、图片流式交互，集成 Qwen-VL 等视觉模型。
- **📋 提示词模板**：内置丰富的金融营销、研报摘要等提示词模板，一键生成专业内容。
- **📄 全格式文档解析**：支持 PDF、Word 及图片的深度解析与智能对话。
- **📜 会话管理**：流式响应体验，支持历史记录持久化及自动标题生成。

---

## 技术栈 🛠️

### 前端 (Next.js 14)
- **框架**: [Next.js](https://nextjs.org/) (App Router & TypeScript)
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
   DATABASE_URL=mysql+mysqlconnector://user:password@localhost/fin_genius
   DASHSCOPE_API_KEY=your_aliyun_api_key
   SECRET_KEY=your_jwt_secret_key
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
│   │   ├── models/     # 数据库 SQL 模型
│   │   └── services/   # 核心业务 (AI 生成、合规审计、文件解析)
│   └── main.py         # 系统入口
├── frontend/           # Next.js 前端源代码
│   ├── src/
│   │   ├── components/ # 基础组件 (Chat, Auth, Prompts)
│   │   ├── store/      # Redux 状态管理
│   │   └── pages/      # 业务页面
└── README.md           # 本文档
```

---

## 许可证 📄

[MIT License](LICENSE)

---
**Fin-Genius** - 让金融更智能，让合规更简单。
