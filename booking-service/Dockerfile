# Booking Service Dockerfile
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Copy package files from booking-service directory
COPY booking-service/package*.json ./

# Install dependencies
RUN npm install

# Copy booking-service source code
COPY booking-service/ .

# Copy utils directory from parent
COPY utils/ ./utils/

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3003/health || exit 1

# Start the service
CMD ["npm", "start"] 