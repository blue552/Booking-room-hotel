# Booking Room System - Quick Start
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BOOKING ROOM SYSTEM STARTUP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "Docker OK" -ForegroundColor Green
} catch {
    Write-Host "Please install Docker Desktop" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Stop existing containers
Write-Host "Cleaning up old containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.microservices.yml down --remove-orphans

# Start system
Write-Host "Starting system..." -ForegroundColor Green
docker-compose -f docker-compose.microservices.yml up --build -d

# Wait and check
Write-Host "Waiting for system to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "SYSTEM STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "ACCESS POINTS:" -ForegroundColor Cyan
Write-Host "  Main Website: http://localhost:8080" -ForegroundColor White
Write-Host "  API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host "  Load Balancer: http://localhost" -ForegroundColor White

Write-Host ""
Write-Host "MAIN PAGES:" -ForegroundColor Cyan
Write-Host "  Home: http://localhost:8080/index.html" -ForegroundColor White
Write-Host "  Login: http://localhost:8080/login.html" -ForegroundColor White
Write-Host "  Register: http://localhost:8080/register.html" -ForegroundColor White
Write-Host "  Rooms: http://localhost:8080/room.html" -ForegroundColor White

Write-Host ""
Write-Host "USEFUL COMMANDS:" -ForegroundColor Cyan
Write-Host "  View logs: docker-compose -f docker-compose.microservices.yml logs -f" -ForegroundColor Gray
Write-Host "  Stop system: docker-compose -f docker-compose.microservices.yml down" -ForegroundColor Gray

Write-Host ""
Write-Host "Enjoy using the system!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Ask to open browser
$openBrowser = Read-Host "Do you want to open browser? (y/n)"
if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    Start-Process "http://localhost:8080"
} 