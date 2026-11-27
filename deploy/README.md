# Deploying Booking Clinic

```
push to main ─► CI (tests) ─► CD: build amd64 + arm64 images ─► GHCR ─► SSH: compose pull + up -d ─► health check
```

The server never builds anything. It pulls the images that CD published (tag `sha-<commit>`), so a 2 GB machine is
enough: the whole stack measures about 1 GB idle.

## 1. Server

Any Ubuntu 22.04 / 24.04 machine with at least 2 GB of RAM. Oracle Cloud Always Free (ARM) works, because the images
are multi-arch.

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 2 GB swap for safety on small machines
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# firewall: SSH + HTTP(S) only (on Oracle Cloud, also open 80/443 in the VCN security list)
sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw allow 443/udp && sudo ufw enable
```

## 2. Domain

Point an `A` record at the server's IP. A free name works too: DuckDNS, or `<ip-with-dashes>.sslip.io`. Caddy obtains
and renews the HTTPS certificate on first start.

## 3. Configuration

```bash
git clone https://github.com/khoazocute/booking-clinic-system.git
cd booking-clinic-system
cp .env.example .env && chmod 600 .env
nano .env
```

| Variable | Value |
|---|---|
| `DOMAIN` | `clinic.example.com` (no scheme) |
| `MYSQL_ROOT_PASSWORD`, `VECTOR_DB_PASSWORD`, `JWT_SECRET`, `AI_INTERNAL_TOKEN` | each one `openssl rand -hex 32`. Set them **before** the first start: the databases read their passwords only when the volume is created |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | the first admin, created on the empty database (password at least 12 characters) |
| `OPENAI_API_KEY` | optional. Without it the assistant runs in free fallback mode. With it, also set a **monthly spend limit** in the OpenAI dashboard |
| `AI_CHAT_DAILY_LIMIT_GLOBAL` | paid assistant turns per day for the whole site (default 100); past it, the free fallback answers |
| `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` | VNPay sandbox. Register `https://<DOMAIN>/api/v1/payments/vnpay/ipn` as the IPN URL |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | optional SMTP for reminder emails (for Gmail, use an app password) |

GHCR packages start **private**. Either make them public (GitHub → Packages → each `booking-clinic-*` package →
Package settings → Change visibility), or log the server in once with a token that has `read:packages`:
`echo <token> | docker login ghcr.io -u <github-user> --password-stdin`.

## 4. First start

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
curl https://$DOMAIN/api/v1/health
```

Production starts with an **empty database**. Log in as the admin and create specialties, doctors and schedules.
The development dump `db_init/init.sql` is deliberately not loaded: it contains development accounts.

## 5. Automatic deploys (GitHub → Settings → Secrets and variables → Actions)

On the server, create a key used only for deploys:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N "" -C "github-deploy"
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/deploy_key          # → secret SSH_KEY (then delete this private key from the server)
ssh-keyscan localhost           # optional → secret SSH_KNOWN_HOSTS (replace localhost with the host name)
```

| Kind | Name | Value |
|---|---|---|
| Secret | `SSH_HOST` | server IP or host name |
| Secret | `SSH_USER` | the Linux user (for example `ubuntu`) |
| Secret | `SSH_KEY` | the private key above |
| Secret | `SSH_PORT` | optional, default 22 |
| Secret | `SSH_KNOWN_HOSTS` | optional; pins the host key (otherwise it is trusted on first use) |
| Variable | `DEPLOY_PATH` | optional, default `booking-clinic-system` (relative to the user's home) |
| Variable | `DEPLOY_URL` | `https://<DOMAIN>`, enables the post-deploy health check |

From then on, every green CI run on `main` deploys automatically. Until the secrets exist, CD only publishes images.

## Operations

```bash
# logs
docker compose -f docker-compose.prod.yml logs -f backend ai-service

# rollback: put the previous tag in .env (IMAGE_TAG=sha-xxxxxxx), then
docker compose -f docker-compose.prod.yml up -d

# daily database backup (crontab -e), keeping 7 days
0 3 * * * cd ~/booking-clinic-system && docker compose -f docker-compose.prod.yml exec -T db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" booking_clinic_db' | gzip > ~/backup-$(date +\%a).sql.gz
```
