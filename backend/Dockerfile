# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

COPY . .

# Generate Prisma Client and Build
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production && npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
