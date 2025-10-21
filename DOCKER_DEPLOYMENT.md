# 🐳 Docker Deployment Guide

This guide explains how to deploy the Service Ticket System using Docker and Docker Compose.

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd service-ticket-system
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Edit `.env` and set your values:

```env
# Database
DB_PASSWORD=your_secure_password_here

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# File Upload
MAX_FILE_SIZE=10485760
```

### 3. Start the Application

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database
- Run database migrations automatically
- Start the Next.js application
- Create necessary volumes for data persistence

### 4. Access the Application

- **Application**: http://localhost:3000
- **Database**: localhost:5432

### 5. Default Login Credentials

```
Admin:
Email: admin@example.com
Password: password123

Agent:
Email: agent1@example.com
Password: password123

Customer:
Email: customer@example.com
Password: password123
```

**⚠️ IMPORTANT: Change these passwords immediately after first login!**

## Docker Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Application only
docker-compose logs -f app

# Database only
docker-compose logs -f postgres
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ Deletes all data)

```bash
docker-compose down -v
```

### Restart Services

```bash
docker-compose restart
```

### Rebuild Application

```bash
docker-compose up -d --build app
```

### Access Database

```bash
docker-compose exec postgres psql -U ticket_admin -d service_tickets
```

### Run Database Migrations

```bash
# Migrations run automatically on first start
# To run manually:
docker-compose exec postgres psql -U ticket_admin -d service_tickets -f /docker-entrypoint-initdb.d/01-create-schema.sql
```

## Production Deployment

### 1. Update Environment Variables

```env
NODE_ENV=production
DB_PASSWORD=<strong-random-password>
JWT_SECRET=<strong-random-secret>
```

### 2. Use Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: service_tickets
      POSTGRES_USER: ticket_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://ticket_admin:${DB_PASSWORD}@postgres:5432/service_tickets
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    ports:
      - "3000:3000"
    volumes:
      - uploads:/app/uploads
    networks:
      - app-network

volumes:
  postgres_data:
  uploads:

networks:
  app-network:
    driver: bridge
```

### 3. Deploy

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Set Up Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Enable SSL with Let's Encrypt

```bash
sudo certbot --nginx -d your-domain.com
```

## Backup and Restore

### Backup Database

```bash
docker-compose exec postgres pg_dump -U ticket_admin service_tickets > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U ticket_admin service_tickets < backup.sql
```

### Backup Uploads

```bash
docker cp service-tickets-app:/app/uploads ./uploads_backup
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker-compose logs app

# Check if database is ready
docker-compose exec postgres pg_isready -U ticket_admin
```

### Database Connection Issues

```bash
# Verify database is running
docker-compose ps

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U ticket_admin -d service_tickets -c "SELECT 1;"
```

### Reset Everything

```bash
# Stop and remove all containers, volumes, and networks
docker-compose down -v
docker system prune -a

# Start fresh
docker-compose up -d
```

## Monitoring

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/health

# Database health
docker-compose exec postgres pg_isready -U ticket_admin
```

### Resource Usage

```bash
docker stats
```

## Scaling

### Horizontal Scaling

```bash
docker-compose up -d --scale app=3
```

### Use Load Balancer (Nginx)

```nginx
upstream app_servers {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    location / {
        proxy_pass http://app_servers;
    }
}
```

## Security Best Practices

1. **Change Default Passwords** immediately
2. **Use Strong JWT Secret** (minimum 32 characters)
3. **Enable HTTPS** in production
4. **Regular Backups** of database and uploads
5. **Update Dependencies** regularly
6. **Monitor Logs** for suspicious activity
7. **Limit Database Access** to application only
8. **Use Environment Variables** for secrets (never commit)

## Updating the Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Check logs
docker-compose logs -f app
```

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review documentation
- Check GitHub issues

---

**Built with ❤️ for SAIF Service Desk**
