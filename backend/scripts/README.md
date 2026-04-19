# 数据库管理脚本

## 脚本说明

### 1. migrate_add_admin_fields.py
添加管理员和审核相关字段到 users 表。

**使用方式:**
```bash
cd /Users/yu/Documents/cloud-notes/zhiliao-cloud-docs/backend
python scripts/migrate_add_admin_fields.py
```

**会添加的字段:**
- `is_admin`: 是否为管理员 (BOOLEAN, 默认 FALSE)
- `is_superadmin`: 是否为超管 (BOOLEAN, 默认 FALSE)
- `is_approved`: 是否通过审核 (BOOLEAN, 默认 FALSE)
- `approved_at`: 审核通过时间 (TIMESTAMP)
- `approved_by`: 审核人ID (UUID)

### 2. init_superadmin.py
创建默认超管账号（如果尚不存在）。

**使用方式:**
```bash
cd /Users/yu/Documents/cloud-notes/zhiliao-cloud-docs/backend
python scripts/init_superadmin.py
```

**默认超管账号:**
- 用户名: `admin`
- 密码: `password01!`

## 首次部署流程

1. 确保数据库已启动并连接正常
2. 运行迁移脚本添加新字段:
   ```bash
   python scripts/migrate_add_admin_fields.py
   ```
3. 创建超管账号:
   ```bash
   python scripts/init_superadmin.py
   ```
4. 启动后端服务

## 注册审核流程

1. 新用户注册后，状态为 `is_approved=false`
2. 用户尝试登录会收到 "账号正在审核中" 的提示
3. 管理员登录后，可以通过以下API查看和审核用户:
   - `GET /api/v1/auth/admin/users?pending_only=true` - 查看待审核用户
   - `POST /api/v1/auth/admin/users/{user_id}/approve` - 审核通过/拒绝

## API列表

### 公开API
- `POST /api/v1/auth/register` - 注册（新用户需要审核）
- `POST /api/v1/auth/login` - 登录（需已通过审核）

### 需要登录
- `GET /api/v1/auth/me` - 获取当前用户信息
- `PUT /api/v1/auth/me` - 更新当前用户信息

### 需要管理员权限
- `GET /api/v1/auth/admin/users` - 获取用户列表
- `GET /api/v1/auth/admin/users?pending_only=true` - 获取待审核用户
- `POST /api/v1/auth/admin/users/{user_id}/approve` - 审核用户
- `GET /api/v1/auth/admin/pending-count` - 获取待审核数量

### 需要超管权限
- `POST /api/v1/auth/admin/users/{user_id}/set-admin` - 设置用户管理员权限
