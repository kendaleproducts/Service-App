# Daniel & Partners Online — production image (Railway, Fly, Render, any Docker host)
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

# Build tools only matter if better-sqlite3 has no prebuilt binary for this platform.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .
# Build needs a session secret only to import modules; the real one is set at runtime.
RUN SESSION_SECRET=build-time-placeholder npm run build && npm prune --omit=dev

# Persistent data (SQLite file + uploads). Mount a volume here.
ENV DATA_DIR=/data
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 3000
CMD ["npm", "run", "start"]
