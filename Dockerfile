# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.14.0
ARG PNPM_VERSION=10.30.3

FROM node:${NODE_VERSION}-bookworm-slim AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build:prod
RUN pnpm run verify:web:standalone
RUN mkdir -p /out/web-public && if [ -d apps/web/public ]; then cp -a apps/web/public/. /out/web-public/; fi
RUN pnpm --filter @hx/bff --prod deploy --legacy /out/bff
RUN pnpm --filter @hx/panel --prod deploy --legacy /out/panel

FROM node:${NODE_VERSION}-bookworm-slim AS runtime-base
ENV NODE_ENV=production
WORKDIR /app

FROM runtime-base AS web
COPY --from=build /app/apps/web/.next/standalone ./apps/web/.next/standalone
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /out/web-public ./apps/web/public
CMD ["node", "apps/web/.next/standalone/apps/web/server.js"]

FROM runtime-base AS bff
COPY --from=build /out/bff ./apps/bff
CMD ["node", "apps/bff/dist/index.js"]

FROM runtime-base AS panel
COPY --from=build /out/panel ./apps/panel
CMD ["node", "apps/panel/dist/index.js"]
