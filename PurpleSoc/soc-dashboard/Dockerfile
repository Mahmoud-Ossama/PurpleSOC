FROM node:22-alpine AS base

# ---- deps stage: install node_modules ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json .npmrc* ./
RUN npm install --legacy-peer-deps

# ---- builder stage: build the app ----
FROM base AS builder
RUN apk add --no-cache curl
WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV MONGODB_URI=mongodb://build-placeholder:27017
ENV MONGODB_DB=ids_db

# Download GeoLite2 database
RUN curl -fsSL \
    "https://git.io/GeoLite2-City.mmdb" \
    -o GeoLite2-City.mmdb && \
    echo "GeoIP downloaded: $(du -sh GeoLite2-City.mmdb)"

RUN npm run build

# ---- runner stage: production image ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

RUN mkdir -p ./public
COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/GeoLite2-City.mmdb ./GeoLite2-City.mmdb

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
