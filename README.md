# 知了云文档 - 个人版

仿照语雀设计的个人云端知识库，支持富文本编辑、Markdown 快捷输入、文档管理等功能。

## 技术栈

- **后端**: Python + FastAPI + SQLAlchemy + PostgreSQL
- **前端**: Vue 3 + TypeScript + Element Plus + contenteditable 编辑器

## 快速开始

### 1. 使用 Docker Compose 启动（推荐）

```bash
cd zhiliao-cloud-docs

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

服务启动后：
- 前端: http://localhost:5173
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

### 2. 本地开发

#### 后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env

# 启动服务
uvicorn app.main:app --reload
```

#### 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

```
已为您创建默认超管账号：

用户名：admin
admin@example.com
密码：
password01!

```

## 功能特性

### 已实现
- [x] 用户注册/登录（JWT 认证）
- [x] 富文本编辑器（支持常见格式）
- [x] 文档 CRUD
- [x] 文件夹管理
- [x] 自动保存
- [x] 版本历史
- [x] 全文搜索

### 待开发
- [ ] Markdown 快捷键
- [ ] 代码块语法高亮
- [ ] 文档导出（PDF/Markdown）
- [ ] 图片上传
- [ ] 暗黑模式
- [ ] 移动端适配

## 项目结构

```
zhiliao-cloud-docs/
├── backend/              # FastAPI 后端
│   ├── app/
│   │   ├── main.py       # 应用入口
│   │   ├── models/       # SQLAlchemy 模型
│   │   ├── routers/      # API 路由
│   │   ├── services/     # 业务逻辑
│   │   └── utils/        # 工具函数
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/             # Vue3 前端
│   ├── src/
│   │   ├── components/   # 组件
│   │   ├── views/        # 页面
│   │   ├── stores/       # Pinia 状态管理
│   │   └── api/          # API 封装
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## API 接口

| 方法 | 路径 | 说明 |
|-----|------|-----|
| POST | /api/v1/auth/register | 用户注册 |
| POST | /api/v1/auth/login | 用户登录 |
| GET | /api/v1/auth/me | 获取当前用户 |
| GET | /api/v1/docs | 获取文档列表 |
| POST | /api/v1/docs | 创建文档 |
| GET | /api/v1/docs/{id} | 获取文档详情 |
| PUT | /api/v1/docs/{id} | 更新文档 |
| DELETE | /api/v1/docs/{id} | 删除文档 |
| GET | /api/v1/folders | 获取文件夹列表 |
| POST | /api/v1/folders | 创建文件夹 |

## 许可证

MIT
