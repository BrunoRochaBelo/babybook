# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages ./packages

RUN pnpm install --frozen-lockfile

FROM base AS devserver

COPY . .

EXPOSE 5173

CMD ["pnpm", "--filter", "@babybook/web", "dev", "--host", "0.0.0.0", "--port", "5173"]

FROM base AS build

COPY . .

ARG VITE_API_BASE_URL=https://api.babybook.dev
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN pnpm --filter @babybook/web build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
