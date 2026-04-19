# 知了云文档 · 文件导入功能 PRD

**文档版本**：V1.0  
**编写日期**：2026-04-15  
**功能状态**：设计 & 开发中

---

## 一、需求背景

用户已有大量本地笔记/文档（Markdown、纯文本），需要快速迁移到「知了云文档」中。当前仅支持手动复制粘贴，批量迁移成本高。

## 二、功能目标

1. **降低迁移成本**：支持一键导入本地 `.md`、`.txt` 文件
2. **保持格式兼容**：Markdown 结构（标题、列表、代码块等）尽可能完整保留
3. **灵活导入目标**：既可将文件导入为「新文档」，也可插入到「当前编辑的文档/书籍章节」中

## 三、功能范围（MVP）

### 3.1 支持格式
| 格式 | 扩展名 | 处理方式 |
|------|--------|----------|
| Markdown | `.md`, `.markdown` | `parseMarkdownToSlate` 转 Slate JSON |
| 纯文本 | `.txt` | 按 `\n\n` 分段为 paragraph |

### 3.2 不支持（P2 迭代）
- `.docx`、`.pdf`、图片等富媒体
- 批量文件夹递归导入
- ZIP 压缩包导入

## 四、交互设计

### 4.1 导入入口
1. **工作台 / 文档列表页顶部**：「新建文档」按钮旁增加「导入文档」按钮
2. **编辑器页面工具栏**：增加「导入」图标按钮，点击后选择「替换当前内容」或「插入到光标处」
3. **云书籍编辑页**：左侧章节树顶部增加「导入章节」按钮

### 4.2 导入流程
```
用户点击导入按钮
    → 唤起系统文件选择器（accept=".md,.txt"）
    → 读取文件内容 + 文件名
    → 根据扩展名解析为 Slate 节点
    → 根据当前页面决定行为：
        A. 在列表页/工作台 → 创建新文档（标题=文件名）
        B. 在文档编辑器 → 弹窗选择「替换全文」或「插入光标处」
        C. 在书籍编辑器 → 创建新章节（标题=文件名，内容=文件内容）
    → 保存到后端
    → Toast 提示成功/失败
```

### 4.3 文件名处理
- 去除扩展名作为默认标题
- 例：`我的笔记.md` → 标题 `我的笔记`
- 若标题为空（如 `.md`），fallback 为 `导入的文档`

### 4.4 内容大小限制
- 前端限制：单文件最大 2MB（避免浏览器卡顿）
- 超大文件提示：「文件超过 2MB，建议拆分成多个文件后导入」

## 五、技术方案

### 5.1 前端解析
```typescript
// 核心函数
async function importFile(file: File): Promise<{ title: string; content: Descendant[] }> {
  const text = await file.text()
  const ext = file.name.split('.').pop()?.toLowerCase()
  const title = file.name.replace(/\.[^/.]+$/, '') || '导入的文档'
  
  let content: Descendant[]
  if (ext === 'md' || ext === 'markdown') {
    content = parseMarkdownToSlate(text)
  } else {
    // txt 或未知格式
    content = parsePlainTextToSlate(text)
  }
  return { title, content }
}
```

### 5.2 纯文本分段逻辑
```typescript
function parsePlainTextToSlate(text: string): Descendant[] {
  const paragraphs = text.split(/\n\n+/).filter(Boolean)
  if (paragraphs.length === 0) {
    return [{ type: 'paragraph', children: [{ text: '' }] }]
  }
  return paragraphs.map(p => ({
    type: 'paragraph',
    children: [{ text: p.replace(/\n+/g, ' ') }]
  }))
}
```

### 5.3 后端变更
**无需新增后端接口**。复用现有接口：
- `POST /api/v1/docs` → 创建新文档
- `PUT /api/v1/docs/:id` → 更新文档内容
- `POST /api/v1/books/:id/chapters` → 创建新章节

### 5.4 错误处理
| 场景 | 前端提示 |
|------|----------|
| 文件超过 2MB | "文件过大，请拆分成多个小文件后导入" |
| 读取失败 | "文件读取失败，请重试" |
| 解析为空 | "文件内容为空，未导入任何内容" |
| 保存失败 | "导入失败：网络错误，请重试" |
| 格式不支持 | "暂不支持该格式，目前仅支持 .md 和 .txt" |

## 六、页面级实现细节

### 6.1 Workspace / DocList
- 在「新建文档」按钮旁增加 `<input type="file" hidden />`
- 选择文件后，直接 `docApi.create({ title })` → `docApi.update(id, { content })` → 跳转编辑页
- 导入过程中按钮显示 loading 状态

### 6.2 DocEdit
- 在 Toolbar 或 Header 更多菜单中增加「导入」
- 点击后弹出小菜单：
  - 「替换当前内容」
  - 「插入到光标位置」
- 替换前需二次确认：「确定要替换当前文档内容吗？未保存的修改将丢失。」

### 6.3 BookEdit
- 在左侧章节树顶部「+ 新建章节」按钮旁增加「导入章节」
- 直接在当前书籍下创建新章节，标题为文件名

## 七、UI 文案

- 按钮：`导入文档`
- Tooltip：`从本地导入 .md 或 .txt 文件`
- 成功提示：`已导入「xxx.md」`
- 确认弹窗标题：`替换文档内容`
- 确认弹窗内容：`导入将覆盖当前文档的现有内容，是否继续？`

## 八、验收标准

1. [x] 成功导入 `.md` 文件，标题、列表、代码块格式正确
2. [x] 成功导入 `.txt` 文件，按段落正确拆分
3. [x] 从列表页导入时，自动创建新文档并跳转编辑
4. [x] 从编辑器导入时，支持「替换」和「插入」两种模式
5. [x] 从书籍编辑器导入时，自动创建新章节
6. [x] 文件大小超过 2MB 时给出明确提示
7. [x] 导入过程中有 loading 态，防止重复操作
