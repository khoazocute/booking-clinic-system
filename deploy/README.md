# Deploying Booking Clinic

```
push to main ─► CI (tests) ─► CD: build amd64 + arm64 images ─► GHCR ─► SSH: compose pull + up -d ─► health check
```

The server never builds anything. It pulls the images that CD published (tag `sha-<commit>`). The tuned production
stack uses about **700 MB of RAM**, measured with `docker stats`: backend about 410 MB, MySQL about 170 MB, the rest
under 50 MB each.

## 1. Create the server (Oracle Cloud Always Free)

1. **Compute → Instances → Create instance**
   - Image: **Canonical Ubuntu 24.04** (or 22.04).
   - Shape: **Ampere VM.Standard.A1.Flex**, 2 OCPU and 12 GB of RAM. This is within the Always Free limit of
     4 OCPU and 24 GB.
   - Networking: keep the defaults and make sure a **public IPv4 address** is assigned.
   - SSH keys: *Generate a key pair for me* and download both keys.
   - If you get *Out of capacity*, try another availability domain, a smaller shape, or try again later.
2. **Open the web ports:** instance → Subnet → *Default Security List* → *Add Ingress Rules*. Use source
   `0.0.0.0/0`, protocol TCP, destination port `80,443`.
3. Consider upgrading the account to **Pay As You Go**. Always Free resources stay free, and Oracle no longer
   reclaims an instance it considers idle, which a quiet demo site can be.

Any other Ubuntu VPS with at least 2 GB of RAM works the same way. Skip the Oracle-specific steps.

## 2. One command on the server

```bash
ssh -i <private-key> ubuntu@<PUBLIC_IP>

curl -fsSL https://raw.githubusercontent.com/khoazocute/booking-clinic-system/main/deploy/setup-server.sh -o setup-server.sh
bash setup-server.sh
```

[`setup-server.sh`](setup-server.sh) is safe to re-run. It does the following:

- Installs Docker and adds a 2 GB swap file.
- Opens ports 80 and 443 in iptables. Oracle's Ubuntu images reject everything except SSH, and the script persists
  the change.
- Clones the repository.
- Creates `.env`:
  - It asks for the domain. The default is `<ip-with-dashes>.sslip.io`: free, and HTTPS works with it.
  - It asks for the admin email.
  - It generates every secret and the admin password, and prints the password once.
  - It turns on demo data.
- Starts the stack.

The first start takes 1–2 minutes (database initialisation and the HTTPS certificate). Then open
`https://<domain>`.

**Demo data** (`DEMO_DATA=true`): 10 specialties and 10 fictional doctors, the same as in the AI evaluation fixtures.
Free slots for the next 7 days (Monday to Saturday) are topped up every night, so the demo never runs out of times
to book. Visitors register their own patient account. Doctor accounts have random passwords, so nobody can log in as
them.

**Optional `.env` settings** (restart afterwards with `docker compose -f docker-compose.prod.yml up -d`):

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Enables the full AI assistant. Also set a **monthly spend limit** in the OpenAI dashboard. `AI_CHAT_DAILY_LIMIT_GLOBAL` (default 100) caps paid turns per day; past it, the free fallback answers. Without a key, the assistant runs in free fallback mode |
| `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` | VNPay sandbox. Register `https://<DOMAIN>/api/v1/payments/vnpay/ipn` as the IPN URL |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | SMTP for reminder emails (for Gmail, use an app password) |

## 3. Automatic deploys

On the server, create a key used only for deploys:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N "" -C "github-deploy"
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/deploy_key            # copy it into the SSH_KEY secret, then: rm ~/.ssh/deploy_key
```

Then go to GitHub → *Settings → Secrets and variables → Actions*:

| Kind | Name | Value |
|---|---|---|
| Secret | `SSH_HOST` | the server's public IP |
| Secret | `SSH_USER` | `ubuntu` |
| Secret | `SSH_KEY` | the private key above |
| Secret | `SSH_KNOWN_HOSTS` | optional: the output of `ssh-keyscan <PUBLIC_IP>`, run from your own machine. It pins the host key; otherwise the key is trusted on first use |
| Variable | `DEPLOY_URL` | `https://<domain>`, which enables the post-deploy health check |
| Variable | `DEPLOY_PATH` | only if the repository is not at `~/booking-clinic-system` |

From then on, every green CI run on `main` deploys automatically.

## Operations

```bash
cd ~/booking-clinic-system
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend ai-service

# rollback: set IMAGE_TAG in .env to an earlier sha-xxxxxxx, then
docker compose -f docker-compose.prod.yml up -d

# daily database backup at 03:00, keeping 7 days (crontab -e)
0 3 * * * cd ~/booking-clinic-system && docker compose -f docker-compose.prod.yml exec -T db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" booking_clinic_db' | gzip > ~/backup-$(date +\%a).sql.gz
```

The development dump `db_init/init.sql` is **not** used in production: it contains development accounts.
