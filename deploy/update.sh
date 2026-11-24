#!/bin/bash
set -e

echo "============================================="
echo "  🚀 Updating Webin10 Platform on EC2        "
echo "============================================="

# 1. Pull latest code from GitHub (safely stashing any local changes like nginx certs)
echo "--> 1. Pulling latest code..."
git stash || true
git pull origin main

# 2. Sync environment variables for frontend Next.js builds if needed
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Ensure .env.local exists for Super Admin
if [ ! -f apps/super-admin/.env.local ]; then
  echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://api.sudhirkdnw.in/api/v1}" > apps/super-admin/.env.local
  echo "--> Created apps/super-admin/.env.local"
fi

# Ensure .env.local exists for Business Admin
if [ ! -f apps/business-admin/.env.local ]; then
  echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://api.sudhirkdnw.in/api/v1}" > apps/business-admin/.env.local
  echo "--> Created apps/business-admin/.env.local"
fi

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
