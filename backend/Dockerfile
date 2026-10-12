FROM node:22-alpine AS base
WORKDIR /app

FROM base AS pruner
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune inventario-backend --docker

FROM base AS deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci

FROM deps AS build
COPY --from=pruner /app/out/full/ .
WORKDIR /app/backend
RUN npx tsc -p tsconfig.json

FROM base AS prod-deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci --omit=dev && npm install drizzle-kit

FROM base AS runtime
COPY --from=prod-deps /app/ ./
WORKDIR /app/backend
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/src/db/schema.ts ./src/db/schema.ts
COPY --from=build /app/backend/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/backend/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh
EXPOSE 3000
CMD ["sh", "entrypoint.sh"]
