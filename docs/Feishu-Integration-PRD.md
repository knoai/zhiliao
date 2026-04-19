# 知了云文档 · 飞书授权与云文档同步功能 PRD

**文档版本**：V1.0  
**编写日期**：2026-04-15  
**功能状态**：设计阶段

---

## 一、需求背景

### 1.1 痛点
许多用户的核心知识资产沉淀在**飞书云文档**中，但「知了云文档」目前仅支持手动复制粘贴迁移，导致：
- 迁移成本高：大量文档无法批量导入
- 双系统维护难：同一内容需要在两个平台重复编辑
- 格式丢失风险：手动复制时表格、代码块等复杂格式易损坏

### 1.2 目标
1. **一键授权**：用户通过 OAuth2 授权飞书账号，安全获取文档访问权限
2. **选择性同步**：支持按文档/知识库维度将飞书云文档同步到「知了云文档」
3. **格式保真**：尽量保留飞书文档的标题、列表、代码块、表格、引用等结构
4. **增量更新**：支持定时或手动触发增量同步，保持内容一致性

---

## 二、功能范围（MVP）

### 2.1 支持同步的内容
| 飞书内容类型 | 同步目标 | 格式处理 | MVP 支持 |
|-------------|---------|---------|---------|
| 飞书云文档 (docx) | 云文档 (Doc) | 飞书 API → Markdown → Slate JSON | ✅ |
| 飞书知识库 (wiki) | 云书籍 (Book) | 保持目录树结构，子页面映射为章节 | ✅ |
| 飞书表格 (sheet) | 暂不同步 | 提示用户暂不支持 | ❌ |
| 飞书多维表格 (bitable) | 暂不同步 | 提示用户暂不支持 | ❌ |

### 2.2 不支持的内容（P2）
- 图片/附件的自动上传与替换（MVP 期保留原飞书图片外链或占位符）
- 双向同步（仅支持飞书 → 知了云文档单向导入）
- 实时自动同步（MVP 期仅支持手动触发 + 定时任务）
- 评论、协作者信息、版本历史

---

## 三、飞书开放平台对接方案

### 3.1 应用类型选择
- **自建应用**（企业自建）或 **商店应用**（上架飞书应用市场）
- 推荐 **自建应用** 起步，配置简单，无需审核

### 3.2 需要申请的权限
```
docx:document:readonly      # 查看云文档内容
wiki:wiki:readonly          # 查看知识库节点
drive:drive:readonly        # 查看云空间文件（下载图片等）
contact:contact.base:readonly   # 获取用户基本信息
offline_access              # 获取 refresh_token（可选但推荐）
```

### 3.3 OAuth2 授权流程（授权码模式）
```
1. 前端点击「绑定飞书」
   → 跳转飞书授权页：
   https://open.feishu.cn/open-apis/authen/v1/index?app_id={APP_ID}&redirect_uri={REDIRECT_URI}

2. 用户在飞书端同意授权
   → 飞书重定向回：
   {REDIRECT_URI}?code=xxx

3. 前端将 code 传给后端 /feishu/callback

4. 后端用 code + app_secret 换取：
   - user_access_token
   - refresh_token（如有 offline_access）
   - 用户 open_id / union_id

5. 后端将 token 加密存储到数据库，关联当前用户
```

### 3.4 Token 刷新机制
- `user_access_token` 有效期约 **2 小时**
- 后端在调用飞书 API 前，先检查 token 是否即将过期（< 10 分钟）
- 使用 `refresh_token` 自动刷新，用户无感知

---

## 四、数据模型设计

### 4.1 新增表：`feishu_bindings`
存储用户与飞书的授权关系。

```python
class FeishuBinding(Base):
    __tablename__ = "feishu_bindings"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)
    
    # 飞书用户信息
    feishu_open_id = Column(String(100), nullable=False)
    feishu_union_id = Column(String(100), nullable=True)
    feishu_user_name = Column(String(100), nullable=True)
    
    # Token（AES 加密存储）
    access_token = Column(String(500), nullable=False)
    refresh_token = Column(String(500), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)  # access_token 过期时间
    
    # 状态
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
```

### 4.2 新增表：`feishu_sync_logs`
记录每次同步的任务状态和结果，便于排查和增量同步。

```python
class FeishuSyncLog(Base):
    __tablename__ = "feishu_sync_logs"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 同步范围
    sync_type = Column(String(20), nullable=False)  # docx / wiki
    source_id = Column(String(200), nullable=False)  # 飞书 doc_token 或 wiki_space_id / node_token
    source_name = Column(String(500), nullable=True)  # 源名称（文档标题/知识库名）
    
    # 同步结果
    target_type = Column(String(20), nullable=False)  # doc / book
    target_id = Column(Uuid, ForeignKey("docs.id"), nullable=True)  # 或 books.id，视 target_type
    
    # 状态
    status = Column(String(20), nullable=False, default="pending")  # pending / running / success / failed
    error_message = Column(Text, nullable=True)
    
    # 内容指纹（用于增量判断）
    source_revision = Column(String(100), nullable=True)  # 飞书文档 revision 或 update_time
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
```

### 4.3 扩展 `users` 表（可选）
若需要展示飞书头像，可新增：
- `feishu_avatar` — 飞书头像 URL

---

## 五、同步机制设计

### 5.1 同步流程图
```
用户选择要同步的飞书文档/知识库
    → 后端调用飞书 API 获取元数据
    → 判断是否已经同步过（查 sync_logs）
        ├─ 已同步 → 更新现有 Doc/Book（增量）
        └─ 未同步 → 新建 Doc/Book
    → 递归获取文档内容（分页/块级 API）
    → 将飞书 Block JSON / Markdown 转换为 Slate JSON
    → 保存到本地数据库
    → 记录 sync_log
    → 返回同步结果
```

### 5.2 飞书 API 调用链路

#### 获取云文档内容
```
GET /open-apis/docx/v1/documents/{document_id}/content
→ 返回文档的 Block 结构（JSON）
```

#### 获取知识库节点树
```
GET /open-apis/wiki/v2/spaces/{space_id}/nodes
→ 返回知识库节点树
```

#### 将 Block JSON 转为 Markdown（推荐）
```
GET /open-apis/docx/v1/documents/{document_id}/raw_content
→ 直接返回 Markdown 格式全文（部分复杂格式可能简化）
```

**MVP 推荐方案**：直接使用 `raw_content` 接口获取 Markdown，再通过现有的 `parseMarkdownToSlate` 转换器解析为 Slate JSON，开发成本最低。

### 5.3 增量同步策略
- **文档维度**：通过飞书文档的 `revision` 字段或 `update_time` 判断是否有更新
- **同步日志对比**：每次同步前对比 `feishu_sync_logs.source_revision`，若一致则跳过
- **知识库维度**：遍历节点树，对每个子节点单独判断增量

### 5.4 定时同步（P1）
- 使用 `APScheduler` 或 `Celery Beat` 每 6 小时扫描一次已绑定的用户
- 对 `is_active = True` 且开启了「自动同步」的绑定记录执行增量同步

---

## 六、后端 API 设计

### 6.1 飞书授权相关

#### `GET /api/v1/feishu/auth-url`
获取飞书授权页 URL。

**Response**
```json
{
  "auth_url": "https://open.feishu.cn/open-apis/authen/v1/index?app_id=cli_xxx&redirect_uri=https%3A%2F%2Fzhiliao.local%2Ffeishu%2Fcallback"
}
```

#### `POST /api/v1/feishu/callback`
前端拿到授权码后传给后端完成绑定。

**Request**
```json
{ "code": "xxx" }
```

**Response**
```json
{
  "message": "飞书账号绑定成功",
  "feishu_user_name": "张三"
}
```

#### `DELETE /api/v1/feishu/bind`
解绑飞书账号，清除 token 和同步日志。

### 6.2 飞书文档列表

#### `GET /api/v1/feishu/docs`
获取当前用户有权限的飞书云文档列表（个人云空间最近文档）。

**Response**
```json
{
  "items": [
    {
      "doc_token": "doxcnxxxxxxxx",
      "title": "产品需求文档",
      "type": "docx",
      "update_time": "2026-04-10T10:00:00Z",
      "url": "https://xxx.feishu.cn/docx/xxx"
    }
  ]
}
```

#### `GET /api/v1/feishu/wikis`
获取当前用户有权限的飞书知识库列表。

**Response**
```json
{
  "items": [
    {
      "space_id": "wikcnxxxxxxxx",
      "name": "技术wiki",
      "description": "团队技术知识库"
    }
  ]
}
```

#### `GET /api/v1/feishu/wikis/{space_id}/nodes`
获取知识库的节点树（目录结构）。

### 6.3 同步操作

#### `POST /api/v1/feishu/sync/doc`
将单个飞书云文档同步为本地云文档。

**Request**
```json
{
  "doc_token": "doxcnxxxxxxxx",
  "folder_id": null
}
```

**Response**
```json
{
  "sync_id": "uuid",
  "status": "success",
  "doc_id": "uuid",
  "title": "产品需求文档"
}
```

#### `POST /api/v1/feishu/sync/wiki`
将整个知识库同步为本地云书籍。

**Request**
```json
{
  "space_id": "wikcnxxxxxxxx",
  "node_token": "wikcnxxxxxxxx"  // 可选，指定从某个节点开始同步
}
```

**Response**
```json
{
  "sync_id": "uuid",
  "status": "success",
  "book_id": "uuid",
  "title": "技术wiki",
  "synced_chapters": 12
}
```

#### `GET /api/v1/feishu/sync-logs`
获取同步历史记录。

---

## 七、前端交互设计

### 7.1 设置页：飞书授权绑定
在「账号设置」页面新增「飞书集成」卡片：

```
┌─────────────────────────────┐
│  飞书集成                     │
│  ─────────────────────────  │
│  [飞书头像] 张三              │
│  已绑定：2026-04-15 10:30    │
│                             │
│  [ 解除绑定 ]                 │
└─────────────────────────────┘
```

未绑定状态：
```
┌─────────────────────────────┐
│  飞书集成                     │
│  ─────────────────────────  │
│  绑定飞书账号，即可一键同步    │
│  飞书云文档到知了云文档        │
│                             │
│  [ 绑定飞书账号 ]             │
└─────────────────────────────┘
```

点击后跳转飞书授权页，授权完成后自动关闭弹窗/返回设置页。

### 7.2 工作台 / 文档列表：导入入口
在「导入文档」按钮的弹层中增加「从飞书导入」选项：

```
[ 导入本地文件 (.md/.txt) ]
[ 从飞书导入 ▶ ]
    ├─ 同步飞书云文档...
    └─ 同步飞书知识库...
```

### 7.3 飞书文档选择器（Modal）
绑定成功后，点击「从飞书导入」弹出选择器：

**Tab 1：我的云文档**
- 表格展示最近 50 个飞书文档
- 每行显示：标题、更新时间、同步状态（已同步/未同步）
- 多选后点击「同步到云文档」

**Tab 2：我的知识库**
- 列表展示知识库
- 点击知识库展开节点树
- 支持勾选单个节点或整库同步
- 点击「同步到云书籍」

### 7.4 同步进度与结果
- 点击同步后，前端轮询 `GET /api/v1/feishu/sync-logs/{sync_id}`
- 显示进度条或 Toast：「正在同步 产品需求文档...」
- 完成后提示：「同步成功！已创建 1 篇云文档、3 个章节」，并提供「立即查看」跳转

---

## 八、格式映射与转换

### 8.1 飞书 Block → Markdown → Slate
利用飞书 `raw_content` 接口直接获取 Markdown，复用现有 `parseMarkdownToSlate`：

| 飞书格式 | Markdown 表示 | Slate 节点 |
|---------|--------------|-----------|
| 标题 1-4 | `#` `##` `###` `####` | `heading-one` ~ `heading-four` |
| 无序列表 | `- ` / `* ` | `bulleted-list` + `list-item` |
| 有序列表 | `1. ` | `numbered-list` + `list-item` |
| 代码块 | ```lang\n...\n``` | `code-block` |
| 引用块 | `> ` | `block-quote` |
| 分割线 | `---` | `divider` |
| 表格 | `\|a\|b\|` | `table` + `table-row` + `table-cell` |
| 粗体/斜体/代码 | `**` `*` `` ` `` | `bold` / `italic` / `code` marks |

### 8.2 图片处理（MVP 简化）
- `raw_content` 返回的 Markdown 中图片通常是飞书临时外链
- MVP 期直接保留外链，不下载图片到本地存储
- P2 期接入 `drive.media.download` 下载图片并上传到本地 OSS/CDN

---

## 九、安全与权限

### 9.1 Token 加密存储
- `access_token` 和 `refresh_token` 必须使用 **AES-256** 加密后存入数据库
- 加密密钥通过环境变量注入，不硬编码在代码中

### 9.2 密钥配置
新增环境变量：
```bash
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxx
FEISHU_REDIRECT_URI=http://localhost:5174/feishu/callback
FEISHU_TOKEN_ENCRYPTION_KEY=32-bytes-long-secret-key!!!
```

### 9.3 回调安全
- 飞书回调地址必须配置 HTTPS（生产环境）
- 前端传回的 `code` 只能使用一次，后端需在 5 分钟内完成换 token
- 绑定关系必须强校验当前登录用户身份，防止横向越权

### 9.4 权限隔离
- 用户只能查看/同步/解绑自己的飞书 token
- 同步操作严格限制在 `current_user.id` 下创建 Doc/Book

---

## 十、错误处理与提示

| 场景 | 前端提示 | 后端处理 |
|-----|---------|---------|
| 用户未绑定飞书 | "请先绑定飞书账号" | 401 + 引导绑定 |
| 授权码过期 | "授权超时，请重新绑定" | 重新生成 auth_url |
| Token 失效 | "飞书授权已过期，请重新绑定" | 刷新失败时标记 is_active=False |
| 无文档权限 | "你没有该文档的访问权限" | 透传飞书 403 错误 |
| 飞书 API 限流 | "飞书服务繁忙，请稍后重试" | 指数退避重试 |
| 文档过大 | "文档超过 10MB，暂不支持同步" | 预处理拒绝 |
| 格式解析失败 | "部分复杂格式未能完全保留" | 降级为纯文本段落 |

---

## 十一、开发排期建议

### 第一阶段（基础授权，1 周）
1. 创建 `feishu_bindings` 表和模型
2. 实现 `GET /feishu/auth-url` 和 `POST /feishu/callback`
3. 实现 Token 刷新机制
4. 前端设置页「绑定飞书」UI

### 第二阶段（文档同步，2 周）
1. 封装飞书 API 客户端（获取文档列表、raw_content）
2. 实现 `POST /feishu/sync/doc`（单文档同步）
3. 前端「飞书文档选择器」Modal
4. 创建 `feishu_sync_logs` 表和增量同步逻辑

### 第三阶段（知识库同步，1.5 周）
1. 实现 Wiki 节点树获取与递归同步
2. 实现 `POST /feishu/sync/wiki`
3. 将 Wiki 目录树映射为 Book + Chapter 结构
4. 同步结果页与跳转优化

### 第四阶段（稳定性与自动化，1 周）
1. 接入 APScheduler 定时增量同步
2. 图片下载与本地存储（可选 P2）
3. 异常监控与告警

---

## 十二、验收标准

- [ ] 用户能成功完成飞书 OAuth2 授权绑定
- [ ] 授权过期后，后端能自动刷新 token（用户无感知）
- [ ] 用户能在前端看到自己最近 50 个飞书云文档
- [ ] 选中飞书文档后，能成功同步为本地云文档（标题、正文、格式正确）
- [ ] 选中知识库后，能成功同步为本地云书籍（目录树映射为章节结构）
- [ ] 重复同步同一文档时，能增量更新本地内容而非新建
- [ ] 解绑飞书后，token 和日志被清除，已同步的文档保留

---

## 十三、附录

### 13.1 飞书开放平台关键链接
- [飞书开放平台 - 创建应用](https://open.feishu.cn/app)
- [获取授权码](https://open.feishu.cn/document/authentication-management/access-token/obtain-oauth-code)
- [获取云文档 raw_content](https://open.feishu.cn/document/docs/docs-v1/get)
- [Wiki 节点列表](https://open.feishu.cn/document/wiki-v1/space-node/list)

### 13.2 项目内复用点
- `parseMarkdownToSlate()` — Markdown → Slate JSON
- `DocService.create()` / `BookService.create_book()` — 创建本地文档/书籍
- `AuthService` — 用户身份校验
