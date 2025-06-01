# Docker Cleanup & Setup Script for Microservices

Write-Host "🧹 Starting Docker cleanup and microservices setup..." -ForegroundColor Yellow

# Step 1: Stop all running containers
Write-Host "`n1️⃣ Stopping all running containers..." -ForegroundColor Green
docker stop $(docker ps -q) 2>$null
if ($?) {
    Write-Host "✅ All containers stopped" -ForegroundColor Green
} else {
    Write-Host "ℹ️ No running containers found" -ForegroundColor Cyan
}

# Step 2: Remove all containers
Write-Host "`n2️⃣ Removing all containers..." -ForegroundColor Green
docker rm $(docker ps -aq) 2>$null
if ($?) {
    Write-Host "✅ All containers removed" -ForegroundColor Green
} else {
    Write-Host "ℹ️ No containers to remove" -ForegroundColor Cyan
}

# Step 3: Remove all images (optional - uncomment if needed)
Write-Host "`n3️⃣ Removing unused images..." -ForegroundColor Green
docker image prune -f
Write-Host "✅ Unused images removed" -ForegroundColor Green

# Step 4: Remove all volumes
Write-Host "`n4️⃣ Removing all volumes..." -ForegroundColor Green
docker volume prune -f
Write-Host "✅ All volumes removed" -ForegroundColor Green

# Step 5: Remove all networks (except defaults)
Write-Host "`n5️⃣ Removing custom networks..." -ForegroundColor Green
docker network prune -f
Write-Host "✅ Custom networks removed" -ForegroundColor Green

# Step 6: Complete system cleanup
Write-Host "`n6️⃣ Complete Docker system cleanup..." -ForegroundColor Green
docker system prune -af --volumes
Write-Host "✅ Docker system cleaned" -ForegroundColor Green

Write-Host "`n🎉 Docker cleanup completed!" -ForegroundColor Yellow
Write-Host "📊 Current Docker status:" -ForegroundColor Cyan

# Show current status
Write-Host "`nContainers:" -ForegroundColor White
docker ps -a

Write-Host "`nImages:" -ForegroundColor White  
docker images

Write-Host "`nVolumes:" -ForegroundColor White
docker volume ls

Write-Host "`n✨ Ready for fresh microservices setup!" -ForegroundColor Green 