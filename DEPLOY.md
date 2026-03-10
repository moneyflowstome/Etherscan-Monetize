# TokenAltcoin — Hostinger VPS Deployment Guide

## Prerequisites
- Hostinger VPS with Ubuntu 22.04+ (or any Linux with Docker)
- Docker and Docker Compose installed
- Domain pointed to your VPS IP (tokenaltcoin.com → your VPS IP)
- Your code pushed to GitHub

## Step 1: Connect to your VPS

```bash
ssh root@your-vps-ip
```

## Step 2: Install Docker (if not already installed)

```bash
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin -y
```

## Step 3: Clone your repo

```bash
cd /opt
git clone https://github.com/moneyflowstome/Etherscan-Monetize.git tokenaltcoin
cd tokenaltcoin
```

## Step 4: Create your .env file

```bash
cp .env.example .env
nano .env
```

Fill in your actual values:
```
POSTGRES_PASSWORD=a_very_strong_random_password
ADMIN_PASSWORD=your_admin_password
ETHERSCAN_API_KEY=your_key
CMC_API_KEY=your_key
CHANGENOW_API_KEY=your_key
BRAVE_API_KEY=your_key
OPENSEA_API_KEY=your_key
```

Save and exit (Ctrl+X, Y, Enter).

## Step 5: Get SSL certificate (first time only)

Before starting with SSL, you need to get the certificate first. Temporarily use HTTP-only nginx:

```bash
# Create a temporary nginx config for certificate generation
cat > nginx-temp.conf << 'EOF'
server {
    listen 80;
    server_name tokenaltcoin.com www.tokenaltcoin.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://app:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Use temp config
cp nginx.conf nginx-ssl.conf
cp nginx-temp.conf nginx.conf

# Start services
docker compose up -d db app nginx

# Get the certificate
docker compose run --rm certbot certonly \
  --webroot --webroot-path /var/www/certbot \
  -d tokenaltcoin.com -d www.tokenaltcoin.com \
  --email your-email@example.com \
  --agree-tos --no-eff-email

# Restore SSL config
cp nginx-ssl.conf nginx.conf
rm nginx-temp.conf nginx-ssl.conf

# Restart nginx with SSL
docker compose restart nginx
```

## Step 6: Start everything

```bash
docker compose up -d --build
```

Your site will be live at https://tokenaltcoin.com

## Useful Commands

```bash
# View logs
docker compose logs -f app
docker compose logs -f nginx

# Restart app after code changes
git pull
docker compose up -d --build app

# Restart everything
docker compose down && docker compose up -d --build

# Check status
docker compose ps

# Database backup
docker compose exec db pg_dump -U tokenaltcoin tokenaltcoin > backup.sql

# Database restore
cat backup.sql | docker compose exec -T db psql -U tokenaltcoin tokenaltcoin

# Update SSL certificate (auto-renews, but manual if needed)
docker compose run --rm certbot renew
docker compose restart nginx
```

## Updating the App

```bash
cd /opt/tokenaltcoin
git pull
docker compose up -d --build app
```

## Firewall Setup (recommended)

```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

## Troubleshooting

- **App won't start**: Check `docker compose logs app` for errors
- **Database connection error**: Make sure db service is healthy: `docker compose ps`
- **SSL errors**: Make sure your domain DNS points to your VPS IP, then re-run certbot
- **502 Bad Gateway**: App is still starting, wait 10-20 seconds and refresh
