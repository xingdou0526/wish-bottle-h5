# ---- React 前端：构建静态文件 → 交给 Caddy 托管 ----
# 构建上下文是 monorepo 根目录（见 docker-compose.yml 的 context: .）

FROM node:20-slim AS build
RUN npm install -g pnpm@10
WORKDIR /app
COPY . .
RUN pnpm install \
 && pnpm --filter @wishbottle/shared build \
 && pnpm --filter @wishbottle/web build

# ---- 运行阶段：Caddy 同时托管静态文件 + 反代 /api ----
FROM caddy:2-alpine
COPY --from=build /app/apps/web/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
