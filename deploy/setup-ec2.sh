#!/bin/bash
set -e

echo "=== Webin10 AWS EC2 Automated Production Setup ==="

# 1. Update system packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx build-essential

# 2. Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
sudo corepack prepare pnpm@latest --activate

# 3. Install PM2 globally
sudo npm install -g pm2

# 4. Install Docker & Docker Compose plugin
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER

# 5. Firewall configuration
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 4000
sudo ufw allow 3001
sudo ufw allow 3002
sudo ufw --force enable

echo "=== System tools installed successfully! Log out and log back in to apply docker group permissions ==="
