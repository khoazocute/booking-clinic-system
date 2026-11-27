#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 22.04 / 24.04 server (built for Oracle Cloud Always Free, Ampere A1).
#
#   curl -fsSL https://raw.githubusercontent.com/khoazocute/booking-clinic-system/main/deploy/setup-server.sh -o setup-server.sh
#   bash setup-server.sh
#
# Safe to re-run: every step checks whether it is already done.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/khoazocute/booking-clinic-system.git}"
APP_DIR="${APP_DIR:-$HOME/booking-clinic-system}"

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

step "1/6 Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER" || true
sudo systemctl enable --now docker >/dev/null

step "2/6 Swap (2 GB)"
if ! sudo swapon --show | grep -q '/swapfile'; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

step "3/6 Firewall: allow HTTP/HTTPS"
# Oracle's Ubuntu images ship iptables rules that REJECT everything except SSH. Insert the web ports before
# that REJECT rule and persist them. (The VCN security list must also allow 80/443: see deploy/README.md.)
if ! dpkg -s iptables-persistent >/dev/null 2>&1; then
  echo iptables-persistent iptables-persistent/autosave_v4 boolean true | sudo debconf-set-selections
  echo iptables-persistent iptables-persistent/autosave_v6 boolean true | sudo debconf-set-selections
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq iptables-persistent >/dev/null
fi
for rule in tcp:80 tcp:443 udp:443; do
  proto="${rule%%:*}"
  port="${rule##*:}"
  if ! sudo iptables -C INPUT -p "$proto" --dport "$port" -m state --state NEW -j ACCEPT 2>/dev/null; then
    reject_line=$(sudo iptables -L INPUT --line-numbers -n | awk '$2 == "REJECT" { print $1; exit }')
    if [ -n "$reject_line" ]; then
      sudo iptables -I INPUT "$reject_line" -p "$proto" --dport "$port" -m state --state NEW -j ACCEPT
    else
      sudo iptables -A INPUT -p "$proto" --dport "$port" -m state --state NEW -j ACCEPT
    fi
  fi
done
sudo netfilter-persistent save >/dev/null

step "4/6 Code"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone --quiet "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

step "5/6 Configuration (.env)"
set_env() { # set_env KEY VALUE: replace or append, never printed
  if grep -q "^$1=" .env; then sed -i "s|^$1=.*|$1=$2|" .env; else echo "$1=$2" >> .env; fi
}
if [ ! -f .env ]; then
  cp .env.example .env
  chmod 600 .env
  public_ip=$(curl -fsS https://ifconfig.me || true)
  default_domain="${public_ip//./-}.sslip.io"
  read -r -p "Domain (Enter = ${default_domain}): " domain
  domain="${domain:-$default_domain}"
  read -r -p "Admin email for the first login: " admin_email
  admin_password=$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)

  set_env DOMAIN "$domain"
  set_env ADMIN_EMAIL "$admin_email"
  set_env ADMIN_PASSWORD "$admin_password"
  for key in MYSQL_ROOT_PASSWORD VECTOR_DB_PASSWORD JWT_SECRET AI_INTERNAL_TOKEN; do
    set_env "$key" "$(openssl rand -hex 32)"
  done
  set_env DEMO_DATA true
  set_env CORS_ALLOWED_ORIGINS "https://$domain"

  echo
  echo "  Admin login: $admin_email / $admin_password"
  echo "  (shown once; it is also in $APP_DIR/.env)"
  echo "  OPENAI_API_KEY is empty: the assistant runs in free fallback mode. Add the key to .env later if you want."
else
  echo ".env already exists: left unchanged"
fi

step "6/6 Start"
sudo docker compose -f docker-compose.prod.yml pull --quiet
sudo docker compose -f docker-compose.prod.yml up -d
domain=$(grep '^DOMAIN=' .env | cut -d= -f2)
echo
echo "Starting. The first start takes 1-2 minutes (database init + HTTPS certificate)."
echo "Then open: https://$domain"
echo "Health:    curl https://$domain/api/v1/health"
