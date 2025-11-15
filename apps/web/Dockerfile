FROM node:20-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages packages
COPY apps/web apps/web

RUN pnpm install --frozen-lockfile

# Modo produção: desativa MSW e usa build real
ENV VITE_ENABLE_MSW=false

RUN pnpm --filter @babybook/web build

FROM nginx:1.27-alpine AS runtime

COPY apps/web/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 4173

CMD ["nginx", "-g", "daemon off;"]

