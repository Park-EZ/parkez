# Build stage - Build the frontend
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies for building frontend
RUN npm install

# Copy source files
COPY . .

# Build the frontend (outputs to /app/dist)
RUN npm run build

# Production stage - Run the server
FROM node:22-alpine
WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/

# Install production dependencies (including @fastify/static)
RUN cd server && npm install --omit=dev

# Copy server code
COPY server ./server

# Copy built frontend from builder stage to server/public
COPY --from=builder /app/dist ./server/public

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Note: MONGODB_URI should be provided via environment variable at runtime
# or via docker-compose/docker run -e MONGODB_URI=...
# Do NOT hardcode it in the Dockerfile for security

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "server/index.js"]