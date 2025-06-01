# API Gateway Dockerfile
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Copy package files from api-gateway directory
COPY api-gateway/package*.json ./

# Install dependencies
RUN npm install

# Copy api-gateway source code
COPY api-gateway/ .

# Copy frontend assets (relative to project root)
COPY UI ./UI
COPY assets ./assets

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the API Gateway
CMD ["npm", "start"]