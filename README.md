<div align="center">

# 🌿 知了云文档

**仿照语雀设计的个人云端知识库 —— 让知识管理更轻盈**

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📖 简介

知了云文档是一款面向个人用户的云端知识管理工具，灵感来源于 [语雀](https://www.yuque.com/)。它以**知识库（Book）**为核心组织单元，支持富文本编辑、Markdown 快捷输入、文档管理、文件夹归档、全文搜索等功能，帮助你构建属于自己的数字花园。

> "知了，知之为知之。" —— 让每一次记录都有价值。

---

## ✨ 功能特性

### 已上线

| 功能 | 描述 |
|------|------|
| 🔐 **JWT 认证** | 用户注册、登录、权限管理 |
| 📝 **富文本编辑器** | 基于 Slate 的现代化编辑器，支持常见格式与 Markdown 快捷输入 |
| 📚 **知识库管理** | 以 Book 为单位组织文档，支持封面、描述、归档 |
| 📁 **文件夹系统** | 树形文件夹结构，支持拖拽移动、无限层级 |
| 🏷️ **文档 CRUD** | 创建、编辑、删除、排序文档，支持阅读/编辑双模式 |
| 💾 **自动保存** | 编辑内容实时自动保存，防止意外丢失 |
| 🕐 **版本历史** | 文档变更自动记录历史版本 |
| 🔍 **全文搜索** | 快速检索文档标题与内容 |
| 🤖 **飞书集成** | 对接飞书开放平台，支持文档同步与协作 |

### 开发中

- [ ] Markdown 快捷键增强
- [ ] 代码块语法高亮
- [ ] 文档导出（PDF / Markdown / Word）
- [ ] 图片与附件上传
- [ ] 🌙 暗黑模式
- [ ] 📱 移动端适配

---

## 🛠️ 技术栈

### 后端
| 技术 | 用途 |
|------|------|
| [FastAPI](https://fastapi.tiangolo.com/) | 高性能异步 Web 框架 |
| [SQLAlchemy 2.0](https://www.sqlalchemy.org/) + [asyncpg](https://magicstack.github.io/asyncpg/current/) | 异步 ORM 与 PostgreSQL 驱动 |
| [Alembic](https://alembic.sqlalchemy.org/) | 数据库迁移管理 |
| [python-jose](https://github.com/mpdavis/python-jose) + [passlib](https://passlib.readthedocs.io/) | JWT 认证与密码哈希 |
| [Pydantic v2](https://docs.pydantic.dev/) | 数据校验与配置管理 |

### 前端
| 技术 | 用途 |
|------|------|
| [React 18](https://react.dev/) | UI 框架 |
| [Vite](https://vitejs.dev/) | 构建工具 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Tailwind CSS](https://tailwindcss.com/) | 原子化 CSS 样式 |
| [Slate](https://docs.slatejs.org/) | 可定制富文本编辑器 |
| [Zustand](https://github.com/pmndrs/zustand) | 轻量级状态管理 |
| [Lucide React](https://lucide.dev/) | 图标库 |
| [Axios](https://axios-http.com/) | HTTP 客户端 |

---

## 🚀 快速开始

### 方式一：Docker Compose（推荐）

一键启动完整环境（含 PostgreSQL）：

```bash
# 克隆项目
git clone https://github.com/knoai/zhiliao.git
cd zhiliao

# 启动所有服务
./start.sh
# 或
docker-compose up -d
```

服务启动后：

| 服务 | 地址 |
|------|------|
| 🖥️ 前端界面 | http://localhost:5173 |
| 🔌 后端 API | http://localhost:8000 |
| 📖 API 文档（Swagger） | http://localhost:8000/docs |
| 📘 API 文档（ReDoc） | http://localhost:8000/redoc |

常用命令：

```bash
docker-compose logs -f   # 查看实时日志
docker-compose down      # 停止服务
docker-compose restart   # 重启服务
```

### 方式二：本地开发

#### 环境要求

- Python 3.10+
- Node.js 18+
- PostgreSQL 15+（本地或 Docker）

#### 1. 启动数据库

```bash
docker run -d \
  --name zhiliao-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=cloud_notes \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:16-alpine
```

#### 2. 启动后端

```bash
cd backend

# 创建虚拟环境（首次）
python3 -m venv venv
source venv/bin/activate

# 安装依赖（首次）
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. 启动前端

```bash
cd frontend

# 安装依赖（首次）
npm install

# 启动开发服务器
npm run dev
```

#### 4. 一键启动（前后端同时）

```bash
./start-local.sh
```

---

## 🔑 默认账号

系统初始化后会自动创建超管账号：

| 项目 | 值 |
|------|-----|
| 用户名 | `admin` |
| 邮箱 | `admin@example.com` |
| 密码 | `password01!` |

> ⚠️ 生产环境请务必修改默认密码！

---

## 📂 项目结构

```
zhiliao/
├── 📁 backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── main.py             # 应用入口
│   │   ├── config.py           # 配置管理
│   │   ├── database.py         # 数据库连接
│   │   ├── models/             # SQLAlchemy 数据模型
│   │   │   ├── user.py
│   │   │   ├── book.py
│   │   │   ├── doc.py
│   │   │   ├── folder.py
│   │   │   └── feishu.py
│   │   ├── routers/            # API 路由
│   │   ├── services/           # 业务逻辑层
│   │   ├── schemas/            # Pydantic 数据校验
│   │   └── utils/              # 工具函数
│   ├── scripts/                # 初始化与迁移脚本
│   ├── requirements.txt
│   └── Dockerfile
│
├── 📁 frontend/                # React + Vite 前端
│   ├── src/
│   │   ├── main.tsx            # 应用入口
│   │   ├── App.tsx             # 根组件
│   │   ├── pages/              # 页面视图
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Workspace.tsx
│   │   │   ├── BookList.tsx
│   │   │   ├── BookEdit.tsx
│   │   │   ├── DocList.tsx
│   │   │   ├── DocEdit.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/         # 组件
│   │   │   ├── editor/         # Slate 编辑器
│   │   │   ├── doc/            # 文档相关组件
│   │   │   ├── layout/         # 布局组件
│   │   │   └── common/         # 通用组件
│   │   ├── api/                # API 请求封装
│   │   ├── stores/             # Zustand 状态管理
│   │   ├── types/              # TypeScript 类型
│   │   └── utils/              # 工具函数
│   ├── package.json
│   └── Dockerfile
│
├── 📁 docs/                    # 产品文档与 PRD
│   ├── Doc-Editor-UX-Redesign-PRD.md
│   ├── Feishu-Integration-PRD.md
│   └── ...
│
├── docker-compose.yml          # Docker 编排
├── start.sh                    # Docker 启动脚本
├── start-local.sh              # 本地开发启动脚本
└── README.md                   # 本文件
```

---

## 🔌 API 概览

| 方法 | 路径 | 说明 |
|:----:|------|------|
| `POST` | `/api/v1/auth/register` | 用户注册 |
| `POST` | `/api/v1/auth/login` | 用户登录 |
| `GET` | `/api/v1/auth/me` | 获取当前用户信息 |
| `GET` | `/api/v1/books` | 获取知识库列表 |
| `POST` | `/api/v1/books` | 创建知识库 |
| `GET` | `/api/v1/docs` | 获取文档列表 |
| `POST` | `/api/v1/docs` | 创建文档 |
| `GET` | `/api/v1/docs/{id}` | 获取文档详情 |
| `PUT` | `/api/v1/docs/{id}` | 更新文档 |
| `DELETE` | `/api/v1/docs/{id}` | 删除文档 |
| `GET` | `/api/v1/folders` | 获取文件夹树 |
| `POST` | `/api/v1/folders` | 创建文件夹 |
| `GET` | `/api/v1/feishu/callback` | 飞书 OAuth 回调 |

> 完整 API 文档请访问：`http://localhost:8000/docs`

---

## 📸 界面预览

> 截图占位 —— 待补充实际运行截图

```
┌─────────────────────────────────────────┐
│  🌿 知了云文档                            │
├──────────┬──────────────────────────────┤
│ 知识库    │                              │
│  📘 工作   │    欢迎使用知了云文档 🎉        │
│  📗 学习   │                              │
│  📙 生活   │   左侧选择知识库开始写作 ✍️     │
├──────────┤                              │
│ 文件夹树  │                              │
│  📁 A    │                              │
│  📁 B    │                              │
├──────────┴──────────────────────────────┤
│  Powered by FastAPI + React + Slate     │
└─────────────────────────────────────────┘
```

---

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

---

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

---

<div align="center">

Made with ❤️ by [knoai](https://github.com/knoai)

</div>
