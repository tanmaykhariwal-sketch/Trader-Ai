FROM node:20-bookworm-slim AS builder
WORKDIR /app

# python3/make/g++ let better-sqlite3 compile its native binding here if no
# matching prebuilt binary exists for this exact Node/OS/arch combination.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/trader-ai.db

# node_modules copied from the builder stage (same base image) so
# better-sqlite3's compiled native binary matches this runtime exactly.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 3000
CMD ["node", "dist/server.mjs"]
