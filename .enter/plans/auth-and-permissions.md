# 权限系统改造计划

## 背景
当前所有数据以 `user_id = 'default_user'` 存储，无任何认证。
目标：接入真实登录体系，实现「个人数据隔离 + 小组共享岗位」。

## 用户确认的需求
- 共享范围：先建小组/团队，只有同组成员能看到共享的岗位
- 分类：每个人可自定义自己的分类
- 已有数据：归属到第一个注册的账号

---

## 阶段一：认证 + 数据隔离（核心）

### 1.1 数据库变更

#### 修改 `jobs` 表
```sql
ALTER TABLE jobs ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE jobs ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE jobs ADD COLUMN shared_to_group_id UUID;  -- 暂时允许 NULL
```
- 现有 job 数据：user_id 设为 NULL（待第一个注册用户认领）

#### 修改 `user_job_status` 表
```sql
ALTER TABLE user_job_status ALTER COLUMN user_id TYPE UUID USING NULL::UUID;
ALTER TABLE user_job_status ALTER COLUMN user_id SET DEFAULT NULL;
```

#### 修改 `job_categories` 表
```sql
ALTER TABLE job_categories ALTER COLUMN user_id TYPE UUID USING NULL::UUID;
```

#### 新增 `groups` 表
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 新增 `group_members` 表
```sql
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',  -- 'owner' | 'member'
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
```

#### 新增 `profiles` 表
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
触发器：新用户注册时自动创建 profile + 复制默认分类。

### 1.2 RLS 策略

| 表 | SELECT | INSERT | UPDATE/DELETE |
|---|---|---|---|
| `jobs` | `user_id = auth.uid()` OR (is_shared=true AND 是同组成员) | 登录用户 | `user_id = auth.uid()` |
| `user_job_status` | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` |
| `job_categories` | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` |
| `groups` | 是成员 | 登录用户 | 是 owner |
| `group_members` | 同组成员可见 | 组 owner | 组 owner |
| `profiles` | 本人 | 本人 | 本人 |

### 1.3 前端：认证流程

新增文件：
- `src/contexts/AuthContext.tsx` — 管理 session，封装 signIn/signUp/signOut
- `src/pages/auth/index.tsx` — 登录/注册页（Tab 切换）
- `src/components/auth/AuthGuard.tsx` — 路由守卫

更新文件：
- `src/main.tsx` — 包裹 AuthProvider
- `src/App.tsx` (或路由文件) — 所有路由套 AuthGuard，未登录跳转 /auth
- `src/hooks/use-jobs.ts` — 所有 `user_id: 'default_user'` 替换为 `useAuth().user.id`
- `src/pages/import/index.tsx` — 导入时传 user_id

Edge Functions：
- `import-job-from-url` — 从 Authorization header 取 user token，解析出 user_id，写入 jobs.user_id

### 1.4 已有数据迁移
- 第一个注册的用户在登录后，系统自动将 `user_id IS NULL` 的 jobs/categories 归属到该用户
- 通过 Supabase Edge Function `claim-default-data` 实现（一次性）

---

## 阶段二：小组 + 共享（在一阶段之上）

### 2.1 新增 UI
- 设置页：创建小组、通过邀请码加入小组、查看成员
- 岗位详情页：「分享到小组」开关（is_shared toggle）
- 首页：新增「小组共享」tab，显示组内其他人共享的岗位（只读，只显示岗位基本信息，不显示对方的投递状态）

### 2.2 共享岗位的数据隔离
- 共享给小组的岗位：组内成员可以看到标题/公司/位置/链接
- 成员可以把共享岗位「另存到自己的列表」（复制一条记录到自己名下）
- 对方的 `user_job_status`（收藏、投递状态）**对其他人不可见**

---

## 不动的部分（零风险）
- JobCard 组件结构
- 面试功能（interview）UI（只更新 user_id 字段）
- 智能搜索、链接导入的 UI 逻辑
- 分类侧边栏组件（改成从个人分类读取即可）

---

## 文件改动清单

### 新增
- `src/contexts/AuthContext.tsx`
- `src/pages/auth/index.tsx`
- `src/components/auth/AuthGuard.tsx`
- `supabase/functions/claim-default-data/index.ts`（一次性数据迁移）
- DB migrations × 5（jobs/user_job_status/job_categories 改列 + groups + group_members + profiles + 默认分类触发器）

### 修改
- `src/main.tsx`（加 AuthProvider）
- `src/App.tsx` / 路由（加 AuthGuard）
- `src/hooks/use-jobs.ts`（替换 default_user）
- `src/pages/import/index.tsx`（传 user_id）
- `supabase/functions/import-job-from-url/index.ts`（从 token 读 user_id）

---

## 验证方法
1. 注册用户 A → 导入岗位 → 注册用户 B → B 看不到 A 的岗位 ✓
2. A 创建小组 → B 通过邀请码加入 → A 共享一个岗位 → B 能看到 ✓
3. B 看不到 A 的收藏/投递状态 ✓
4. 面试功能/导入功能正常工作 ✓
5. 已有数据由 A（第一个注册者）认领 ✓
