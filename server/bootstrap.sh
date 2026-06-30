#!/usr/bin/env bash
set -euo pipefail
# bootstrap.sh — run ONCE on a fresh Oracle Cloud Ubuntu VM (as root or with sudo)
#
# Usage:
#   ./bootstrap.sh yourdomain.com github.com/youruser/yourrepo GH_PAT
#
#   GH_PAT = GitHub Personal Access Token (classic, repo scope)
#            Create one at github.com/settings/tokens

DOMAIN="${1:?Usage: $0 yourdomain.com github.com/user/repo GH_PAT}"
REPO="${2:?Usage: $0 yourdomain.com github.com/user/repo GH_PAT}"
PAT="${3:?Usage: $0 yourdomain.com github.com/user/repo GH_PAT}"

echo "==> Installing Node.js 22 LTS"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node --version

echo "==> Creating ri user"
id ri 2>/dev/null || useradd -m -s /bin/bash ri

echo "==> Cloning repo"
mkdir -p /opt/ri-server
git clone "https://x-access-token:${PAT}@${REPO}.git" /opt/ri-server
cd /opt/ri-server

echo "==> Storing PAT for auto-updates (deploy.sh)"
echo "$PAT" > .git_pat
chmod 400 .git_pat
chown ri:ri .git_pat

# rewrite origin URL so future pulls don't need to re-auth
git remote set-url origin "https://x-access-token:${PAT}@${REPO}.git"

echo "==> Installing npm dependencies"
cd /opt/ri-server/server
npm install --production

echo "==> Writing deploy.sh"
cat > /opt/ri-server/deploy.sh << 'DPL'
#!/usr/bin/env bash
set -euo pipefail
cd /opt/ri-server
git pull
cd server
npm install --production
systemctl restart ri-server
echo "deploy ok: $(date)"
DPL
chmod +x /opt/ri-server/deploy.sh

echo "==> Generating SSH key for GitHub Actions"
mkdir -p /opt/ri-server/.ssh
rm -f /opt/ri-server/.ssh/actions_key*
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
ExecStart=/usr/bin/node index.js
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
echo "== Cloudflare DNS (do this now) =="
echo "  Dashboard → DNS → Add A record:"
echo "    Name: ws"
echo "    IPv4: $MY_IP"
echo "    Proxy: Proxied (orange cloud)"
echo ""
echo "== Cloudflare Workers domain (do this now) =="
echo "  Dashboard → Workers & Pages → ri → Domains"
echo "  → Add Custom Domain: $DOMAIN"
echo ""
echo "  OR add to wrangler.jsonc and redeploy:"
echo '    "routes": [{"pattern": "'"$DOMAIN"'","custom_domain":true}]'
echo "  Then: npm run build && npx wrangler deploy"
echo ""
echo "== Workers env var =="
echo "  Dashboard → ri → Settings → Variables → Add:"
echo "    PUBLIC_WS_URL = wss://ws.$DOMAIN"
echo ""
echo "== GitHub Secrets (for auto-deploy) =="
echo "  Your repo → Settings → Secrets and variables → Actions"
echo "  Add these 3 secrets:"
echo ""
echo "    ORACLE_HOST = $MY_IP"
echo "    ORACLE_USER = ri"
echo "    ORACLE_SSH_KEY = (paste below)"
echo ""
echo "-------- ORACLE_SSH_KEY (private key, copy this) --------"
cat /opt/ri-server/.ssh/actions_key
echo "-------- END ORACLE_SSH_KEY --------"
echo ""
echo "  Done. Delete this key from your clipboard after saving."
echo ""
echo "  Next pushes to main that touch server/ will auto-deploy."
echo "============================================"
