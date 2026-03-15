# Этап 1: Установка зависимостей
FROM node:22-alpine AS deps
WORKDIR /app

# Копируем корневые файлы package для установки зависимостей workspace
COPY package.json package-lock.json ./

# Копируем package.json всех workspace-пакетов
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

# Устанавливаем все зависимости (включая devDependencies для сборки)
RUN npm ci

# Этап 2: Сборка проекта
FROM node:22-alpine AS build
WORKDIR /app

# Увеличиваем лимит памяти для Node.js (необходимо для Vite)
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Копируем установленные зависимости из предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json

# Копируем исходный код shared пакета и собираем его
COPY packages/shared ./packages/shared
RUN npm run build -w @lab/shared

# Копируем исходный код web-приложения и собираем
COPY apps/web ./apps/web
RUN npm run build -w @lab/web

FROM nginx:alpine AS runner
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

