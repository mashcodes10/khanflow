# Docker Deployment Guide

This guide covers deploying KhanFlow using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Active Supabase database
- OAuth credentials configured

## Quick Start

### 1. Configure Environment Variables

**Backend (`backend/.env`):**
```bash
cp backend/.env.example backend/.env
# Edit with production values
```

**Frontend (`new-frontend/.env.local`):**
```bash
cp new-frontend/.env.example new-frontend/.env.local
# Edit with production values
```

⚠️ **Important**: 
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Update all redirect URIs to production URLs
- Use Supabase connection pooling URL

### 2. Build and Run

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Verify Deployment

```bash
# Check backend health
curl http://localhost:8000/api/health

# Check frontend health
curl http://localhost:3000/api/health

# View running containers
docker ps
```

## Production Configuration

### Environment Variables

**Critical Settings:**

Backend:
```env
NODE_ENV=production
DATABASE_URL=<supabase_pooler_url>
JWT_SECRET=<strong_secret_key>
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/integration/google/callback
MS_REDIRECT_URI=https://yourdomain.com/api/integration/microsoft/callback
FRONTEND_ORIGIN=https://yourdomain.com
```

Frontend:
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_APP_ORIGIN=https://yourdomain.com
```

### Building for Production

```bash
# Build with production optimizations
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Run with production settings
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Monitoring

### Health Checks

Both services include health checks:
- Backend: `GET /api/health`
- Frontend: `GET /api/health`

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100
```

### Container Stats

```bash
docker stats
```

## Troubleshooting

### Services Won't Start

```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs backend
docker-compose logs frontend

# Restart specific service
docker-compose restart backend
```

### Database Connection Issues

1. Verify `DATABASE_URL` in backend/.env
2. Ensure Supabase allows connections from your IP
3. Check if using connection pooling URL (port 6543)

### Environment Variable Issues

```bash
# Verify environment variables are loaded
docker-compose config

# Recreate containers with new env vars
docker-compose up -d --force-recreate
```

## Updating Deployment

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build

# Or rebuild specific service
docker-compose up -d --build backend
```

## Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (⚠️ deletes data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Security Best Practices

1. **Never commit .env files**
2. **Use strong JWT secrets** (32+ characters)
3. **Enable HTTPS** in production
4. **Restrict CORS origins** to your domain
5. **Use Supabase connection pooling**
6. **Keep dependencies updated**
7. **Run as non-root user** (already configured)

## Next Steps

- Set up reverse proxy (Nginx/Traefik)
- Configure SSL certificates
- Set up automated backups
- Implement monitoring (Prometheus/Grafana)
- Configure log aggregation
