#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# GyanDeep Backend – Oracle Cloud Always Free Setup Script
# Run this on your Oracle Cloud VM after SSH login
#
# Oracle Cloud Always Free tier (ARM A1 Ampere):
#   • 4 OCPUs, 24 GB RAM, 200 GB block storage – FREE FOREVER
#   • Never sleeps | Static public IP | Full Docker support
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "=== Step 1: System Update ==="
sudo apt-get update -y && sudo apt-get upgrade -y

echo "=== Step 2: Install Docker ==="
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Run Docker without sudo
sudo usermod -aG docker $USER
newgrp docker

echo "=== Step 3: Install Git ==="
sudo apt-get install -y git

echo "=== Step 4: Open Firewall Port 8000 ==="
# Oracle Cloud ALSO needs Security List rule in VCN (see guide below)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8000 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || sudo apt-get install -y iptables-persistent && sudo netfilter-persistent save

echo ""
echo "✅ Server ready. Now follow the deployment steps in DEPLOY_GUIDE.md"
