# ---- NestJS API ----
# 构建上下文是 monorepo 根目录（见 docker-compose.yml 的 context: .）
FROM node:20-slim

# Prisma 在 Debian 上需要 openssl
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && npm install -g pnpm@10

WORKDIR /app

# 复制整个 monorepo（node_modules / dist 已被 .dockerignore 排除）
COPY . .

RUN pnpm install \
 && pnpm --filter @wishbottle/shared build \
 && pnpm --filter @wishbottle/api exec prisma generate \
 && pnpm --filter @wishbottle/api build

EXPOSE 3000

# 启动时先跑数据库迁移（幂等，只应用未执行的），再启动服务
CMD ["sh", "-c", "pnpm --filter @wishbottle/api exec prisma migrate deploy && node apps/api/dist/src/main.js"]
