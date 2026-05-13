# Vocabulary

词根记忆背单词小程序工程。前端使用 Taro 单一代码库同时发布微信小程序和抖音小程序，后端使用 NestJS；Supabase 负责 Auth、PostgreSQL、Storage，Redis 保留用于复习队列和缓存。

## 目录

```text
vocabulary/
├── app/        # Taro 4 + React + TypeScript 小程序
├── server/     # NestJS + Supabase Auth/PostgreSQL/Storage + Redis 后端
├── docs/       # 产品、接口、数据、设计、MVP 文档
└── PRD.md      # 产品需求文档
```

## 常用命令

```bash
pnpm install
pnpm dev:server
pnpm dev:app:weapp
pnpm dev:app:tt
pnpm typecheck
```

## 环境准备

1. 复制 `server/.env.example` 为 `server/.env` 或 `server/.env.local`。
2. **Supabase API Keys**（控制台：**Settings → API Keys**，例如 `https://supabase.com/dashboard/project/_/settings/api-keys`；说明见 [Understanding API keys](https://supabase.com/docs/guides/api/api-keys)）  
   - **`SUPABASE_URL`**：项目 URL（可与 Dashboard **Connect** 对话框或同一设置页中的 Project URL 一致）。  
   - **`SUPABASE_ANON_KEY`**：填 **Publishable key**（推荐，`sb_publishable_...`）；也可使用 **Legacy** 标签页里的 **`anon` JWT**（旧版「可公开」密钥）。二者在本项目中对应「低权限、面向客户端场景」的用法（服务端里配合 Auth 登录）。  
   - **`SUPABASE_SERVICE_ROLE_KEY`**：填 **Secret key**（推荐，`sb_secret_...`）；也可使用 **Legacy** 标签页里的 **`service_role` JWT**。二者对应服务端特权（绕过 RLS），**仅后端环境变量**，切勿写入小程序或前端仓库。  
   Supabase 推荐新项目优先使用 Publishable / Secret，Legacy `anon` / `service_role` 将在 JWT 轮换等场景下更易踩坑。
3. 配置 `DATABASE_URL`（连接池）与 `DIRECT_URL`（直连迁移）。
4. 在 Supabase Storage 创建 `media` bucket，或通过 `SUPABASE_MEDIA_BUCKET` 指定自定义 bucket。
5. 配置 Redis，用于复习队列与缓存。
6. 执行 `pnpm --filter @vocabulary/server prisma:generate`。
7. 执行 `pnpm --filter @vocabulary/server prisma:migrate` 初始化数据库。
