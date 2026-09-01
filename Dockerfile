FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Drop the firebase service account out of the image — only the legacy
# firebase router needs it; it's mounted at runtime in compose.
RUN rm -rf config/fbServiceAccountKey.json || true
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://localhost:5000/ >/dev/null || exit 1
USER node
CMD ["node", "server.js"]
