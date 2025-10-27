# ---------- deps ----------
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json ./
COPY yarn.lock ./
RUN if [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile || (echo "Lockfile stale → updating..." && yarn install); \
    else \
      yarn install; \
    fi

# ---------- build ----------
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Важно: сборка именно через Nest CLI, чтобы сработали assets из nest-cli.json
RUN yarn build

# План B: если кто-то собрал не через nest build — всё равно положим статику
RUN [ -d static ] && cp -R static dist/static || true

# Жёсткая проверка: main.js и app.module.js должны лежать в ОДНОЙ папке (dist/)
RUN test -f dist/main.js && test -f dist/app.module.js || \
    (echo "dist/main.js or dist/app.module.js is missing. dist layout:"; find dist -maxdepth 2 -type f; exit 1)

# ---------- runner ----------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"
RUN addgroup -S app && adduser -S app -G app
USER app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/main.js"]