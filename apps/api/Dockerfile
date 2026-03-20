# Этап 1: Установка зависимостей
FROM node:22-alpine AS deps
WORKDIR /app

# Копируем корневые файлы package для установки зависимостей workspace
COPY package.json package-lock.json ./

# Копируем package.json всех workspace-пакетов
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

# Устанавливаем все зависимости (включая devDependencies для сборки)
RUN npm ci

# Этап 2: Сборка проекта
FROM node:22-alpine AS build
WORKDIR /app

# Копируем установленные зависимости из предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json

# Копируем исходный код shared пакета и собираем его
COPY packages/shared ./packages/shared
RUN npm run build -w @lab/shared

# Копируем исходный код API и собираем
COPY apps/api ./apps/api
RUN npm install -g @nestjs/cli && npm run build -w @lab/api

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=deps /app/node_modules ./node_modules

# Установка системных библиотек для Chromium (Debian)
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    fonts-liberation \
    xdg-utils \
    dbus \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_DISABLE_HEADLESS_WARNING=true
EXPOSE 3000
CMD ["node", "dist/main.js"]

