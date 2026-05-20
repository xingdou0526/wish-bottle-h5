# WishBottle 愿望瓶

把 `愿望瓶/愿望瓶.html` 这份 Claude Design 生成的 H5 原型重构为 **Vite + React 前端 + NestJS 后端** 的 pnpm monorepo。视觉与交互忠实还原，所有数据接入后端持久化。

```
WishBottle/
├── apps/
│   ├── web/        # Vite + React + TS（端口 5173）
│   └── api/        # NestJS + Prisma + PostgreSQL（端口 3000）
├── packages/
│   └── shared/     # 前后端共享 zod schemas + 常量
└── 愿望瓶/          # 原始 HTML 原型（保留作设计参考）
```

## 一次性准备

### 1. 安装依赖

```powershell
pnpm install
```

### 2. 启动一个本地 PostgreSQL

任何方式都行，举几个例：

```powershell
# Docker
docker run --name wishbottle-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16

# 或者本机已装 PostgreSQL，直接创建数据库即可
```

### 3. 配置 `.env`

```powershell
Copy-Item apps\api\.env.example apps\api\.env
```

按需修改 `DATABASE_URL` 与 `JWT_SECRET`。

### 4. 迁移数据库 & 播种 demo 数据

```powershell
pnpm prisma:migrate         # 首次会要求输入迁移名，比如 init
pnpm prisma:seed
```

种子里预置了 4 个 demo 账号，密码统一 `demo1234`：

- `demo@wishbottle.app` · 小晴 🌸
- `lin@wishbottle.app` · 林夕 🌙
- `wen@wishbottle.app` · 阿文 ☁️
- `cici@wishbottle.app` · CiCi 🍀

四位互为好友，每人 5 条 demo wish。

## 启动

```powershell
# 终端 A — 后端
pnpm dev:api          # → http://localhost:3000/api

# 终端 B — 前端
pnpm dev:web          # → http://localhost:5173
```

前端 Vite 把 `/api/*` 代理到 NestJS（见 `apps/web/vite.config.ts`）。

## 关键路由与接口

| 路由 | 说明 |
| --- | --- |
| `/welcome` `/login` `/register` | 信封风欢迎 / 登录 / 注册 |
| `/app/bottle` | 瓶子页（Matter.js 物理 · 摇一摇 · 许愿） |
| `/app/me` | 我的（未实现 / 未拆封 / 已成真 / 好友） |
| `/app/friends` | 好友（邀请 / 接受 / 移除） |

| 接口（均挂 `/api`） | 鉴权 | 说明 |
| --- | --- | --- |
| `POST /auth/register` | × | 注册（自动生成 JWT） |
| `POST /auth/login` | × | 登录 |
| `GET  /auth/me` | ✓ | 当前用户 |
| `PATCH /users/me` | ✓ | 更新昵称/生日/签名/头像 |
| `POST /wishes` | ✓ | 创建愿望 |
| `GET  /wishes?scope=mine\|friend&status=pending\|sealed\|done` | ✓ | 列表 |
| `GET  /wishes/:id` | ✓ | 单条（sealed 时隐藏 text） |
| `PATCH /wishes/:id` | ✓ | 标记成真 / 写故事 |
| `DELETE /wishes/:id` | ✓ | 丢掉（仅 owner） |
| `GET  /friends` | ✓ | 好友列表 |
| `DELETE /friends/:id` | ✓ | 解除好友 |
| `POST /friends/invites { toEmail }` | ✓ | 邀请（已注册即建友谊，未注册建邀请） |
| `GET  /friends/invites?direction=incoming\|outgoing` | ✓ | 邀请列表 |
| `POST /friends/invites/:id/accept\|decline` | ✓ | 处理邀请 |

## 端到端冒烟测试

1. 访问 http://localhost:5173 → 自动跳到 `/welcome`。
2. 点 **登录** 用 `demo@wishbottle.app / demo1234` 进入。
3. 瓶子页：可以看到 5 颗纸星掉进瓶中；鼠标划过星星会被推开；点 **摇一摇** 触发抖动并随机抽出一封信。
4. 瓶子页点 **许个愿**：写文本 → 选时间封印 → 选贴纸 → 选寄给/实现者（自己或好友）→ 投进瓶子。
5. **我的** 页：四个 sub-tab 切换；未拆封页是信封样式，点击有拆封仪式；点 **已成真** 写实现故事。
6. **好友** 页：添加好友、接受邀请、移除好友。
7. 浏览器拉到 ≤480px 宽度查看全屏模式；放大到 >480px 看 iOS phone-shell 外框。

## 与原型对照

打开 `愿望瓶/screenshots/` 内的截图，与新前端同屏对比关键界面：
- `welcome.png` ↔ `/welcome`
- `01-v3-journal-sealed-list.png` ↔ `/app/me` 的"未拆封"
- `01-v4-journal-wish-modal.png` ↔ 写愿望弹窗
- `modal-clean.png` ↔ 抽中愿望弹窗

## 与原型的差异

- **去掉**：`tweaks.jsx` / `tweaks-panel.jsx` 调试面板，以及 v1-夜空 旧版本相关文件。
- **改成**：localStorage → PostgreSQL；明文密码 → bcrypt 哈希；session 通过 JWT access token。
- **保留**：所有 CSS（直接拷贝自 `styles.css` 与 `auth.css`，逐步可按需模块化）、SVG 瓶子、Matter.js 物理、纸星 canvas 绘制、信封拆封动画、印章效果（待补，仅成真 toast）。
- **未涉及**：原型里的 `meteors.js` 流星只在 `v1-夜空` 版本使用，未在当前 `愿望瓶.html` 中加载，因此也未移植。

## 部署到云服务器（Ubuntu + Docker Compose + HTTPS）

三个容器：`db`(PostgreSQL) + `api`(NestJS) + `web`(Caddy 托管前端静态文件并反代 `/api`)。Caddy 自动申请并续期 Let's Encrypt 证书。

### 前置

1. 一台 Ubuntu/Debian 云服务器，已装 Docker 与 Docker Compose 插件：
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
2. 一个域名，其 A 记录已解析到服务器公网 IP。
3. 服务器安全组放行 **80** 与 **443** 端口（Caddy 申请证书需要 80）。

### 步骤

```bash
# 1. 把项目传上服务器（git clone 或 scp 均可）
git clone <你的仓库> wishbottle && cd wishbottle

# 2. 配置生产环境变量
cp .env.production.example .env
vim .env          # 填 DOMAIN / POSTGRES_* / JWT_SECRET

# 3. 构建并启动（首次构建约几分钟）
docker compose up -d --build

# 4. 查看状态与日志
docker compose ps
docker compose logs -f api
```

访问 `https://你的域名` 即可。api 容器启动时会自动执行 `prisma migrate deploy` 建表。

### 灌入 demo 数据（可选）

```bash
docker compose exec api pnpm --filter @wishbottle/api seed
```

### 常用运维命令

```bash
docker compose logs -f            # 全部日志
docker compose restart api        # 重启某个服务
docker compose down               # 停止（数据保留在 volume）
docker compose up -d --build      # 改代码后重新部署
docker compose exec db pg_dump -U <user> <db> > backup.sql   # 备份数据库
```

> 数据库数据存在名为 `pgdata` 的 Docker volume 里，`docker compose down` 不会删除；要彻底清空才加 `-v`。

## 常见问题

- **`pnpm prisma:migrate` 报连不上 db** — 检查 `apps/api/.env` 里 `DATABASE_URL`、确认 Postgres 已运行、端口与密码匹配。
- **`@prisma/client` 找不到** — 重新跑一次 `pnpm --filter @wishbottle/api exec prisma generate`。
- **前端登录后立刻被踢回 welcome** — 后端没起或 CORS 没放行 `http://localhost:5173`，检查 `apps/api/.env` 的 `WEB_ORIGIN`。
- **字体加载慢** — 中文手写字体走 `fonts.googleapis.com`，国内网络可能慢。可改用 `@fontsource/zcool-xiaowei` 等本地化包替换 `index.html` 里的 `<link>`。
