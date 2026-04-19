# 知了云笔记 · 文档创建与阅读体验重构 实施方案

**文档版本**：V1.0  
**编写日期**：2026-04-15  
**关联 PRD**：《Doc-Editor-UX-Redesign-PRD.md》

---

## 一、技术方案概述

### 1.1 改造原则

1. **最小侵入**：基于现有 `slate` + `slate-react` 编辑器与 React 技术栈改造，不替换底层富文本引擎
2. **组件拆分**：将臃肿的 `DocEdit.tsx` 拆分为多个职责单一的原子组件
3. **样式统一**：使用 Tailwind CSS 变量与自定义类名结合，确保排版一致性
4. **向后兼容**：现有 API、数据格式、路由结构保持不变

### 1.2 技术栈确认

| 层级 | 现有技术 | 改造策略 |
|------|---------|---------|
| 框架 | React 18 + Vite | 保持不变 |
| 状态管理 | Zustand | 保持不变，阅读/编辑模式状态新增到 `docStore` |
| 样式 | Tailwind CSS 3.4 | 增加自定义排版工具类 |
| 编辑器 | Slate 0.112 | 样式改造，`readOnly` 支持阅读态 |
| 图标 | lucide-react | 保持不变 |
| 路由 | react-router-dom v6 | 保持不变，阅读/编辑共用同一路由 |

---

## 二、文件变更清单

### 2.1 新增文件

| 文件路径 | 职责 |
|---------|------|
| `frontend/src/components/doc/DocEditHeader.tsx` | 文档页顶部极简导航栏（面包屑 + 操作按钮） |
| `frontend/src/components/doc/DocSidebar.tsx` | 左侧文档树侧边栏（提取自 DocEdit） |
| `frontend/src/components/doc/DocCanvas.tsx` | 中间编辑/阅读区容器（纸张效果） |
| `frontend/src/components/doc/DocTitle.tsx` | 文档标题输入组件（大字号） |
| `frontend/src/components/doc/DocFooter.tsx` | 文档底部信息条 |
| `frontend/src/components/doc/DocOutlinePanel.tsx` | 右侧大纲 + 文档信息卡片 |
| `frontend/src/components/doc/ReadModeToggle.tsx` | 编辑/阅读模式切换按钮 |
| `frontend/src/components/doc/index.ts` | 组件统一导出 |
| `frontend/src/styles/doc-editor.css` | 文档编辑器专属样式（排版、纸张效果、动画） |

### 2.2 修改文件

| 文件路径 | 修改内容 |
|---------|---------|
| `frontend/src/pages/DocEdit.tsx` | 重构为组合式组件，移除内联 UI 逻辑 |
| `frontend/src/components/editor/SlateEditor.tsx` | 增加 `readOnly` 属性，优化渲染样式 |
| `frontend/src/components/editor/Element.tsx` | 优化各元素的阅读态样式 |
| `frontend/src/components/editor/DocumentOutline.tsx` | 大纲样式升级，增加 active 高亮 |
| `frontend/src/stores/docStore.ts` | 新增 `readMode` / `setReadMode` 状态 |
| `frontend/src/styles/index.css` | 导入 `doc-editor.css` |
| `frontend/src/App.tsx` | （如有需要）调整布局类名 |

### 2.3 废弃/清理

- `DocEdit.tsx` 中内联的左侧文档列表逻辑提取到 `DocSidebar.tsx`，原文件不再保留冗余 JSX

---

## 三、组件设计详述

### 3.1 DocEditHeader - 顶部极简导航栏

```tsx
interface DocEditHeaderProps {
  title: string;
  status: 'draft' | 'published';
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  readMode: boolean;
  onToggleReadMode: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onSave: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}
```

**布局结构**：
- 高度 `48px`，背景 `#ffffff`，底部边框 `1px solid #e5e7eb`
- 左侧：面包屑 `云文档 / 全部文档 / 当前文档标题`（标题过长时截断）
- 中间（可选）：协作状态占位（P2）
- 右侧：
  1. 「阅读模式 / 编辑文档」切换按钮（`ghost` 样式）
  2. 保存状态文字（`text-xs text-gray-400`）
  3. 「发布」/「撤回」主按钮
  4. 「更多操作」下拉菜单（导入、历史、删除）

### 3.2 DocSidebar - 左侧文档树

```tsx
interface DocSidebarProps {
  docs: DocListItem[];
  currentDocId?: string;
  collapsed: boolean;
  onToggle: () => void;
  onCreateDoc: () => void;
  onSelectDoc: (id: string) => void;
}
```

**视觉规范**：
- 宽度 `240px`，背景 `#ffffff`
- 顶部：「+ 新建文档」按钮 + 收起按钮
- 文档列表：每项 `px-3 py-2`，hover `bg-gray-50`
- 当前文档：左侧 `3px` 蓝色竖线高亮，背景 `bg-blue-50/50`
- 折叠状态：宽度变为 `0`，通过一个悬浮在左侧的圆形按钮重新展开

### 3.3 DocCanvas - 中间编辑/阅读区容器

```tsx
interface DocCanvasProps {
  children: React.ReactNode;
}
```

**视觉规范**：
- 外层：`flex-1 overflow-y-auto bg-[#f5f6f7]`
- 内层纸张容器：
  - `max-w-[780px] mx-auto`
  - `bg-white rounded-lg shadow-sm`
  - `px-12 py-10`（桌面端）
  - `min-h-[calc(100vh-120px)]` 保证纸张足够长

### 3.4 DocTitle - 文档标题输入

```tsx
interface DocTitleProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}
```

**视觉规范**：
- 输入框 `w-full`，`text-[32px] font-semibold text-gray-900`
- `border-none outline-none bg-transparent`
- placeholder：`text-gray-400`
- 底部 `mb-6` 与正文隔开
- `readOnly` 时表现为普通 `<h1>`，不可聚焦

### 3.5 DocFooter - 文档底部信息条

```tsx
interface DocFooterProps {
  author: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}
```

**视觉规范**：
- 位于纸张容器最底部
- `mt-16 pt-6 border-t border-gray-100`
- 文字 `text-xs text-gray-400`
- 布局：作者 | 创建于 2026-04-15 | 更新于 2026-04-15 | 1,234 字

### 3.6 DocOutlinePanel - 右侧大纲与信息

```tsx
interface DocOutlinePanelProps {
  content: Descendant[];
  activeId?: string;
  readMode: boolean;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  wordCount?: number;
}
```

**视觉规范**：
- 宽度 `220px`，背景 `#ffffff`
- 固定定位在右侧，独立滚动
- **大纲部分**：
  - 标题「目录」，`text-sm font-medium text-gray-700 mb-3`
  - 目录项根据标题层级缩进：`level-1 pl-0`, `level-2 pl-3`, `level-3 pl-6`
  - 目录项 `text-sm text-gray-600 hover:text-blue-600`
  - active 项：`text-blue-600 bg-blue-50 rounded`
- **文档信息卡片**（仅阅读态显示）：
  - `mt-6 pt-6 border-t border-gray-100`
  - 显示作者、创建时间、更新时间、字数

### 3.7 ReadModeToggle - 模式切换按钮

```tsx
interface ReadModeToggleProps {
  readMode: boolean;
  onToggle: () => void;
}
```

**交互**：
- 编辑态显示：`📖 阅读模式`
- 阅读态显示：`✏️ 编辑文档`
- 按钮样式：`px-3 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors`

---

## 四、样式改造细节

### 4.1 纸张效果 CSS

```css
/* frontend/src/styles/doc-editor.css */
.doc-paper {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  min-height: calc(100vh - 120px);
}

@media (max-width: 768px) {
  .doc-paper {
    border-radius: 0;
    box-shadow: none;
    min-height: auto;
  }
}
```

### 4.2 Slate 编辑器排版优化

```css
/* 覆盖现有 slate-editor 类 */
.slate-editor {
  font-size: 16px;
  line-height: 1.8;
  color: #1f2937;
}

.slate-editor p {
  margin-bottom: 1em;
}

.slate-editor h1 {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
}

.slate-editor h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 1.2em;
  margin-bottom: 0.6em;
}

.slate-editor h3 {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.slate-editor blockquote {
  border-left: 4px solid #3b82f6;
  background-color: #f8fafc;
  padding: 12px 16px;
  margin: 1em 0;
  border-radius: 0 6px 6px 0;
  color: #475569;
}

.slate-editor ul,
.slate-editor ol {
  margin-bottom: 1em;
  padding-left: 1.5em;
}

.slate-editor li {
  margin-bottom: 0.5em;
}
```

### 4.3 动画过渡

```css
.doc-sidebar {
  transition: width 300ms ease, opacity 300ms ease;
}

.doc-sidebar-collapsed {
  width: 0;
  opacity: 0;
  overflow: hidden;
}

.read-mode-transition {
  transition: opacity 200ms ease;
}
```

---

## 五、状态管理调整

### 5.1 docStore 新增状态

```ts
// frontend/src/stores/docStore.ts
interface DocStoreState {
  // ... 现有状态
  readMode: boolean;
  setReadMode: (mode: boolean) => void;
}
```

**设计说明**：
- `readMode` 默认值为 `false`（进入编辑页默认是编辑态）
- 切换文档时保持上一次的阅读/编辑偏好（通过 localStorage 持久化可选）

---

## 六、开发顺序与里程碑

### 阶段一：基础布局重构（Day 1 ~ 2）

1. 创建 `styles/doc-editor.css`，定义纸张效果与排版基础样式
2. 拆分 `DocSidebar`、`DocCanvas`、`DocTitle`、`DocFooter` 组件
3. 重写 `DocEdit.tsx`，搭建三栏布局骨架
4. 验证：页面能正常加载，三栏布局正确，无样式错乱

### 阶段二：编辑态细节打磨（Day 3 ~ 4）

1. 调整 `SlateEditor.tsx` 与 `Element.tsx` 的样式，匹配新的排版规范
2. 实现 `DocEditHeader`，包含面包屑、保存状态、操作菜单
3. 实现左侧文档树的高亮与折叠交互
4. 验证：标题输入、正文编辑、自动保存功能正常

### 阶段三：阅读态与大纲（Day 5 ~ 6）

1. `docStore` 增加 `readMode` 状态
2. 实现 `ReadModeToggle` 与阅读态切换逻辑
3. `SlateEditor` 支持 `readOnly` 属性，阅读态隐藏工具栏与光标
4. 重构 `DocumentOutline.tsx`，实现平滑滚动与当前位置高亮
5. 实现 `DocOutlinePanel`，阅读态显示文档信息卡片
6. 验证：编辑/阅读切换流畅，大纲跳转准确

### 阶段四：验收与回归（Day 7）

1. 回归测试：新建文档、编辑保存、版本历史、导入导出、发布撤回
2. 移动端适配测试
3. 性能检查：长文档（>10000 字）滚动是否卡顿
4. 修复回归问题，整理代码

---

## 七、接口与数据兼容性

### 7.1 无需变更的接口

- `GET /api/docs` - 文档列表
- `GET /api/docs/:id` - 获取文档详情
- `PUT /api/docs/:id` - 更新文档
- `POST /api/docs` - 创建文档
- `DELETE /api/docs/:id` - 删除文档
- `GET /api/docs/:id/versions` - 版本历史

### 7.2 数据格式兼容性

- Slate JSON 结构保持不变
- 文档字段（`title`、`content`、`status`、`word_count` 等）保持不变
- 前端仅做 UI 层改造，不修改数据层

---

## 八、风险评估与应对

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| Slate 编辑器样式冲突 | 中 | 中 | 使用更具体的 CSS 选择器，避免全局覆盖 |
| 三栏布局在低端屏适配差 | 中 | 高 | `1280px` 以下自动隐藏右侧大纲，`1024px` 以下隐藏左侧文档树 |
| `readOnly` 模式下 Slate 仍显示 placeholder | 低 | 中 | 在 `Editable` 组件上条件渲染 placeholder 属性 |
| 重构导致现有功能回归 | 高 | 中 | 按里程碑逐步验证，每完成一个阶段做完整功能回归 |
| 大纲高亮在长文档滚动时性能差 | 低 | 低 | 使用 `IntersectionObserver` 或节流滚动事件 |

---

## 九、附录

### 9.1 响应式断点策略

| 屏幕宽度 | 布局策略 |
|---------|---------|
| `≥1440px` | 三栏完整显示（左 240px + 中 780px + 右 220px） |
| `1280px ~ 1439px` | 隐藏右侧大纲，通过顶部按钮或浮动按钮触发 |
| `1024px ~ 1279px` | 隐藏左侧文档树，中间编辑区宽度自适应 |
| `< 1024px` | 进入单栏模式，左右侧栏均隐藏，通过抽屉方式访问 |

### 9.2 关键变量速查

```ts
// 布局尺寸
const SIDEBAR_WIDTH = 240;
const OUTLINE_WIDTH = 220;
const CANVAS_MAX_WIDTH = 780;
const HEADER_HEIGHT = 48;

// 颜色
const BG_PAGE = '#f5f6f7';
const BG_CARD = '#ffffff';
const BORDER = '#e5e7eb';
const TEXT_PRIMARY = '#1f2937';
const TEXT_SECONDARY = '#6b7280';
const TEXT_MUTED = '#9ca3af';
const ACCENT = '#2563eb';

// 字号
const FONT_TITLE = '32px';
const FONT_H1 = '28px';
const FONT_H2 = '24px';
const FONT_H3 = '20px';
const FONT_BODY = '16px';
const FONT_META = '12px';
```
