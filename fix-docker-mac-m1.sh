#!/bin/bash

echo "=========================================="
echo "Docker Desktop Mac M1 Fix Script"
echo "=========================================="
echo "This will fix Docker Desktop issues on Apple Silicon Macs"
echo ""

# Stop Docker completely
echo "Step 1: Stopping Docker Desktop..."
pkill -f "Docker Desktop"
pkill -f "com.docker.backend"
pkill -f "docker"
sleep 3

# Reset Docker VM
echo "Step 2: Resetting Docker VM..."
rm -rf ~/Library/Containers/com.docker.docker/Data/vms
rm -rf ~/Library/Containers/com.docker.docker/Data/docker.raw

# Clean Docker caches
echo "Step 3: Cleaning Docker caches..."
rm -rf ~/Library/Caches/com.docker.docker
rm -rf ~/Library/Logs/Docker\ Desktop
rm -rf ~/Library/Application\ Support/Docker\ Desktop

# Clean Rosetta cache (M1 specific)
echo "Step 4: Cleaning Rosetta cache..."
sudo rm -rf /Library/Apple/usr/libexec/oah/versions

# Reset network settings
echo "Step 5: Resetting network..."
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Fix permissions
echo "Step 6: Fixing permissions..."
sudo chown -R $(whoami) ~/Library/Containers/com.docker.docker
sudo chown -R $(whoami) ~/Library/Group\ Containers/group.com.docker

# Clear DNS cache
echo "Step 7: Clearing DNS cache..."
sudo dscacheutil -flushcache

echo ""
echo "=========================================="
echo "Manual steps to complete:"
echo "1. Restart your Mac"
echo "2. Download Docker Desktop 4.24.2 (stable version)"
echo "3. Install and run Docker Desktop"
echo "4. If still having issues, try Rosetta mode"
echo "=========================================="
echo "" 