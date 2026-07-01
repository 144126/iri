#!/usr/bin/env bash
set -euo pipefail
# bootstrap.sh — run ONCE on Oracle Cloud Ubuntu VM (as root / with sudo)
#
# Usage:
#   ./bootstrap.sh yourdomain.com github.com/youruser/yourrepo GH_PAT

DOMAIN="${1:?Usage: $0 yourdomain.com github.com/user/repo GH_PAT}"
REPO="${2:?Usage: $0 yourdomain.com github.com/user/repo GH_PAT}"
PAT="${3:?Usage: $0 yourdomain.com github.com/user/repo GH_PAT}"

echo "==> Installing Deno"
curl -fsSL https://deno.land/install.sh | sh
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
echo 'export DENO_INSTALL="$HOME/.deno"' >> ~ri/.profile
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~ri/.profile
ln -sf "$DENO_INSTALL/bin/deno" /usr/local/bin/deno
deno --version

echo "==> Creating ri user"
id ri 2>/dev/null || useradd -m -s /bin/bash ri

echo "==> Cloning repo"
mkdir -p /opt/ri-server
git clone "https://x-access-token:${PAT}@${REPO}.git" /opt/ri-server
cd /opt/ri-server
git remote set-url origin "https://x-access-token:${PAT}@${REPO}.git"

echo "==> Writing deploy.sh"
cat > /opt/ri-server/deploy.sh << 'DPL'
#!/usr/bin/env bash
set -euo pipefail
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
cd /opt/ri-server
git pull
systemctl restart ri-server
echo "deploy ok: $(date)"
DPL
chmod +x /opt/ri-server/deploy.sh

echo "==> Generating SSH key for GitHub Actions"
mkdir -p /opt/ri-server/.ssh
ssh-keygen -t ed25519 -f /opt/ri-server/.ssh/actions_key -N "" -C "github-actions"
mkdir -p ~ri/.ssh
cat /opt/ri-server/.ssh/actions_key.pub >> ~ri/.ssh/authorized_keys
chown -R ri:ri ~ri/.ssh /opt/ri-server/.ssh
chmod 600 ~ri/.ssh/authorized_keys
chmod 700 ~ri/.ssh
chmod 600 /opt/ri-server/.ssh/actions_key

echo "==> Setting up systemd service"
cat > /etc/systemd/system/ri-server.service << UNIT
[Unit]
Description=RI WebSocket Relay
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ri
Group=ri
WorkingDirectory=/opt/ri-server/server
ExecStart=/usr/local/bin/deno run --allow-net --allow-env index.ts
Restart=always
RestartSec=5
Environment=PORT=8080
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now ri-server

echo "==> Opening port 8080 in OS firewall"
ufw allow 8080/tcp 2>/dev/null || true
iptables -C INPUT -p tcp --dport 8080 -j ACCEPT 2>/dev/null \
  || iptables -A INPUT -p tcp --dport 8080 -j ACCEPT 2>/dev/null || true

MY_IP=$(curl -4 -s ifconfig.me 2>/dev/null || echo "<YOUR_VM_IP>")

echo ""
echo "============================================"
echo "  SERVER DEPLOYED"
echo ""
echo "  Oracle VM IP: $MY_IP"
echo ""
echo "== Cloudflare DNS =="
echo "  Dashboard → DNS → Add A record:"
echo "    Name: ws  |  IPv4: $MY_IP  |  Proxy: Proxied"
echo ""
echo "== Cloudflare Workers domain =="
echo "  Dashboard → Workers & Pages → ri → Domains → Add: $DOMAIN"
echo ""
echo "== Workers env var =="
echo "  Dashboard → ri → Settings → Variables:"
echo "    PUBLIC_WS_URL = wss://ws.$DOMAIN"
echo ""
echo "== GitHub Secrets (repo → Settings → Actions) =="
echo "    ORACLE_HOST = $MY_IP"
echo "    ORACLE_USER = ri"
echo "    ORACLE_SSH_KEY = (paste below)"
echo ""
echo "-------- ORACLE_SSH_KEY --------"
cat /opt/ri-server/.ssh/actions_key
echo "-------- END --------"
echo "============================================"
