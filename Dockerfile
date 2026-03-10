FROM node:20-alpine AS base

WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=5000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN npm ci --omit=dev && \
    npm install drizzle-kit tsx && \
    npm cache clean --force

RUN chmod +x docker-entrypoint.sh && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
