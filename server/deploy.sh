#!/usr/bin/env bash
set -euo pipefail
cd /opt/ri-server
git pull
systemctl restart ri-server
echo "deploy ok: $(date)"
