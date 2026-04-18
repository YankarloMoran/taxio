FROM node:23-slim AS base

# Default environment variables
ENV PORT=7331
ENV NODE_ENV=production

# Build stage
FROM base AS builder

# Install dependencies required for Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client (requires a dummy DATABASE_URL for generation)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM base

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    ghostscript \
    graphicsmagick \
    openssl \
    libwebp-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create upload directory and set permissions
RUN mkdir -p /app/upload

# Copy built assets from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/middleware.ts ./

# Copy i18n and translations (required by next-intl)
COPY --from=builder /app/i18n ./i18n
COPY --from=builder /app/messages ./messages

# Copy server-side modules
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/models ./models
COPY --from=builder /app/components ./components
COPY --from=builder /app/forms ./forms
COPY --from=builder /app/hooks ./hooks
COPY --from=builder /app/ai ./ai

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create directory for uploads
RUN mkdir -p /app/data

EXPOSE 7331

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
