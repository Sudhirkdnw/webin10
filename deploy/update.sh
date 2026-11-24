#!/bin/bash
set -e

echo "============================================="
echo "  🚀 Updating Webin10 Platform on EC2        "
echo "============================================="

# 1. Pull latest code from GitHub
echo "--> 1. Pulling latest code..."
git pull origin main

# 2. Install any new dependencies
echo "--> 2. Installing dependencies..."
pnpm install

# 3. Sync database schema if changed
echo "--> 3. Syncing database schema..."
pnpm --filter @webin10/backend exec prisma db push

# 4. Build backend and frontend applications
echo "--> 4. Building applications..."
pnpm build

# 5. Reload PM2 processes with zero-downtime
echo "--> 5. Reloading PM2 processes..."
pm2 reload ecosystem.config.js || pm2 restart ecosystem.config.js

echo "============================================="
echo "  ✅ Webin10 successfully updated and live!   "
echo "============================================="
