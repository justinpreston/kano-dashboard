# Kano Dashboard — Quick Start

## Prerequisites

- Docker + Docker Compose
- OpenClaw workspace at `~/clawd/`
- Node.js 22+ (for local development only)

## Production Deployment (Docker)

### 1. Set Environment Variables

```bash
cd ~/github/kano-dashboard
cp .env.example .env.local

# Edit .env.local
# JWT_SECRET=<generate with: openssl rand -base64 32>
# DASHBOARD_PASSWORD=<your-password>
```

### 2. Build and Start

```bash
docker compose build
docker compose up -d
```

### 3. Verify

```bash
# Check health
curl http://localhost:3100/api/health

# View logs
docker compose logs -f
```

### 4. Access Dashboard

Open: http://localhost:3100  
Login with password from `DASHBOARD_PASSWORD` env var

---

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your secrets
```

### 3. Run Dev Server

```bash
npm run dev
# Open http://localhost:3000
```

---

## Useful Commands

```bash
# Production
docker compose up -d      # Start
docker compose stop       # Stop
docker compose restart    # Restart
docker compose down       # Stop and remove
docker compose logs -f    # View logs

# Development
npm run dev              # Dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run linter
```

---

## Security

- Dashboard is **read-only** — no write operations
- No code execution (no exec/spawn/child_process)
- All API routes require JWT authentication
- Secrets stripped from config endpoint
- Container runs as non-root user (nodejs:1001)
- Read-only filesystem with tmpfs for cache

---

## Troubleshooting

### Container won't start
```bash
docker compose logs
# Check for missing env vars or port conflicts
```

### Auth fails
```bash
# Verify password in .env.local
docker compose exec kano-dashboard env | grep DASHBOARD_PASSWORD
```

### Can't access dashboard
```bash
# Check if port 3100 is available
lsof -i :3100
# Check container health
docker compose ps
```

---

**Kano Dashboard v1.0** — http://localhost:3100
