# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ---- Runtime ----
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts and package.json for runtime deps
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Install only production dependencies
RUN npm ci --omit=dev

EXPOSE 5173

CMD ["node", "server/index.js"]