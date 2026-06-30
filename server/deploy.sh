#!/usr/bin/env bash
set -euo pipefail
cd /opt/ri-server
git pull
cd server
npm install --production
systemctl restart ri-server
echo "deploy ok: $(date)"
