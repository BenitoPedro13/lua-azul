# Multi-stage build. Build context is the REPO ROOT:
#   docker build -f apps/bot/Dockerfile -t lua-azul-bot .
# Railway/Fly use this when pointed at apps/bot/Dockerfile.

# ---- base: pnpm via corepack ----
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---- deps: cached install layer ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/bot/package.json apps/bot/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---- build: prisma client + tsc ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/bot/node_modules ./apps/bot/node_modules
COPY . .
RUN pnpm --filter @lua-azul/bot db:generate \
 && pnpm --filter @lua-azul/bot build

# ---- runtime: slim production image ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/bot/node_modules ./apps/bot/node_modules
COPY --from=build /app/apps/bot/dist ./apps/bot/dist
COPY --from=build /app/apps/bot/prisma ./apps/bot/prisma
COPY --from=build /app/apps/bot/package.json ./apps/bot/package.json
WORKDIR /app/apps/bot
# Apply pending migrations, then boot.
CMD ["sh", "-c", "pnpm db:deploy && node dist/index.js"]
