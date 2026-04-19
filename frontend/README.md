# 知了云文档 - React 前端

基于 React + TypeScript + Slate.js 的现代化编辑器前端。

## 技术栈

- **框架**: React 18
- **语言**: TypeScript
- **构建**: Vite 5
- **编辑器**: Slate.js (真正的富文本编辑器)
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **路由**: React Router 6
- **图标**: Lucide React

## 启动方式

### 方式一：一键启动（前后端）

```bash
cd /Users/yu/Documents/cloud-notes/zhiliao-cloud-docs
./start-react.sh
```

### 方式二：单独启动前端

```bash
cd frontendR

# 安装依赖（首次）
npm install

# 启动开发服务器
npm run dev
```

### 方式三：同时启动 Vue 和 React 版本

```bash
# 终端 1 - 后端
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# 终端 2 - Vue 前端
cd frontend && npm run dev

# 终端 3 - React 前端
cd frontendR && npm run dev
```

## 访问地址

| 服务 | 地址 | 说明 |
|-----|------|-----|
| React 前端 | http://localhost:5174 | **推荐**，真正的 Slate 编辑器 |
| Vue 前端 | http://localhost:5173 | 备用，contenteditable 编辑器 |
| API 文档 | http://localhost:8000/docs | Swagger UI |
| API 地址 | http://localhost:8000 | REST API |

## Slate.js 编辑器特性

### Markdown 快捷键
| 输入 | 效果 |
|-----|------|
| `# ` | 一级标题 |
| `## ` | 二级标题 |
| `### ` | 三级标题 |
| `> ` | 引用块 |
| `- ` / `* ` | 无序列表 |
| `1. ` | 有序列表 |
| `` ` `` | 行内代码 |

### 快捷键
| 快捷键 | 效果 |
|-------|------|
| `Ctrl+B` | 加粗 |
| `Ctrl+I` | 斜体 |
| `Ctrl+U` | 下划线 |
| `` Ctrl+` `` | 行内代码 |
| `Tab` | 插入两个空格 |

## 项目结构

```
frontendR/
├── src/
│   ├── components/
│   │   ├── editor/           # Slate 编辑器
│   │   │   ├── SlateEditor.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   ├── Element.tsx   # 块级元素渲染
│   │   │   ├── Leaf.tsx      # 文本样式渲染
│   │   │   ├── utils.ts      # 编辑器工具函数
│   │   │   └── custom-types.ts
│   │   └── layout/
│   │       └── MainLayout.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── DocList.tsx
│   │   └── DocEdit.tsx
│   ├── stores/
│   │   ├── authStore.ts      # Zustand 状态
│   │   ├── docStore.ts
│   │   └── folderStore.ts
│   ├── api/
│   │   ├── request.ts
│   │   ├── auth.ts
│   │   ├── doc.ts
│   │   └── folder.ts
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── index.css
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## 与 Vue 版本的区别

| 特性 | React + Slate | Vue + contenteditable |
|-----|---------------|-----------------------|
| 编辑器内核 | **Slate.js** (专业富文本框架) | contenteditable |
| 数据格式 | Slate JSON (结构化) | HTML 字符串 |
| Markdown 快捷键 | ✅ 完整支持 | ❌ 不支持 |
| 协同编辑 | ✅ 可扩展 (基于 Slate) | ❌ 较难实现 |
| 插件生态 | ✅ 丰富 | ❌ 无 |
| 开发体验 | ✅ 类型安全 | ⚠️ 一般 |

## 推荐

**React 版本** 是更专业的选择，适合：
- 需要真正的富文本编辑体验
- 计划扩展更多编辑器功能
- 未来需要协同编辑
- 喜欢 Slate 的数据模型

**Vue 版本** 适合：
- 简单文档编辑需求
- 轻量级场景
- 偏好 Vue 生态

## 下一步扩展

1. **代码高亮**: 集成 Prism.js 或 highlight.js
2. **图片上传**: 拖拽上传、粘贴上传
3. **表格**: Slate 表格插件
4. **公式**: KaTeX 集成
5. **导出**: Markdown、PDF 导出
