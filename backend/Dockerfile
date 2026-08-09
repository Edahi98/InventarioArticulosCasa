FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx tsc -p tsconfig.json

FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm install drizzle-kit

FROM node:22-alpine
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Schema source + drizzle config needed for drizzle-kit push at startup (both engines, chosen at runtime by ENGINE)
COPY src/db/schema.ts ./src/db/schema.ts
COPY src/db/schema.pg.ts ./src/db/schema.pg.ts
COPY drizzle.config.ts ./drizzle.config.ts
COPY drizzle.config.pg.ts ./drizzle.config.pg.ts
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh
EXPOSE 3000
CMD ["sh", "entrypoint.sh"]
