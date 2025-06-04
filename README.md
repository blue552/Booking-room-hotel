# 🏨 Hotel Booking System

Modern microservices-based hotel booking system with Redis distributed locking and API Gateway pattern.

## 🚀 Quick Start

```bash
# Start production system
./deploy-production.sh

# Access application
http://localhost        # Frontend & API
```

## 🏗️ Architecture

```
Client → NGINX:80 → API Gateway → Microservices → PostgreSQL/Redis
```

### Pattern 1: NGINX → API Gateway → Services
- **NGINX**: Load balancer & static file server (Port 80)
- **API Gateway**: Service routing & authentication (Internal)
- **Microservices**: Business logic (Internal only)
- **Data Layer**: PostgreSQL + Redis

## 📚 Documentation

- [Docker & Microservices Guide](DOCKER_MICROSERVICES_GUIDE.md)
- [Booking Logic Guide](BOOKING_GUIDE.md)  
- [Authentication Guide](HEADER_AUTH_GUIDE.md)
- [Frontend Integration](FRONTEND_INTEGRATION_GUIDE.md)

## 🧪 Testing

```bash
# API tests
curl http://localhost/api/users/
curl http://localhost/api/rooms/
curl http://localhost/api/bookings/

# Or use test.http file in your REST client
```

## 🔧 Development

```bash
# Start development mode
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose logs -f

# Scale API Gateway
docker-compose --profile scale up -d api-gateway-2
```

## 📦 Services

- **API Gateway** - Entry point & routing
- **User Service** - Authentication & user management  
- **Room Service** - Room inventory & management
- **Booking Service** - Booking logic with distributed locking
- **NGINX** - Load balancer & static file server
- **PostgreSQL** - Primary database
- **Redis** - Caching & distributed locks

## 🔐 Security Features

- JWT authentication
- Redis distributed locking
- Internal service communication only
- NGINX as single entry point

## 🌟 Key Features

- **Concurrency Control**: Redis locks prevent double bookings
- **Scalable Architecture**: Independent scaling of API Gateway and services
- **High Availability**: Health checks and failover mechanisms
- **Clean API Design**: RESTful endpoints with proper error handling

