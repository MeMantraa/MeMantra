FROM node:22-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

FROM base AS dev
WORKDIR /app/apps/mobile

FROM base AS build
WORKDIR /app

ARG EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api
ENV EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/mobile/package.json apps/mobile/package.json

RUN pnpm install --frozen-lockfile

COPY apps/mobile apps/mobile

RUN pnpm --filter mobile exec expo export --platform web --output-dir dist

FROM nginx:1.27-alpine AS runtime

COPY apps/mobile/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/mobile/dist /usr/share/nginx/html

EXPOSE 80
