# Quick Start - Booking Room System
Write-Host "🚀 Starting Booking Room System..." -ForegroundColor Green
docker-compose -f docker-compose.microservices.yml up --build -d
Write-Host "✅ System started! Open: http://localhost:8080" -ForegroundColor Green 