# ☁️ Cloud Deployment Guide

This guide covers deploying the SAIF Service Desk to various cloud platforms with managed PostgreSQL databases.

---

## Table of Contents

1. [Database Connection Strategy](#database-connection-strategy)
2. [AWS Deployment](#aws-deployment)
3. [Azure Deployment](#azure-deployment)
4. [Google Cloud Deployment](#google-cloud-deployment)
5. [Vercel + Managed Database](#vercel--managed-database)
6. [Railway Deployment](#railway-deployment)
7. [DigitalOcean Deployment](#digitalocean-deployment)
8. [Connection Pooling](#connection-pooling)
9. [SSL/TLS Configuration](#ssltls-configuration)
10. [Migration Strategy](#migration-strategy)

---

## Database Connection Strategy

### Current Local Setup

```typescript
// lib/db.ts - Current configuration
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
```

### Cloud-Ready Configuration

Update `lib/db.ts` for cloud deployment:

```typescript
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false, // For managed databases
  } : false,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end()
  process.exit(0)
})

export { pool }
```

---

## AWS Deployment

### Option 1: AWS RDS + ECS (Recommended)

#### 1. Create RDS PostgreSQL Instance

```bash
# Using AWS CLI
aws rds create-db-instance \
  --db-instance-identifier saif-service-desk-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username dbadmin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name your-subnet-group \
  --backup-retention-period 7 \
  --publicly-accessible false
```

#### 2. Get Connection String

```bash
# RDS Endpoint
aws rds describe-db-instances \
  --db-instance-identifier saif-service-desk-db \
  --query 'DBInstances[0].Endpoint.Address'
```

Connection string format:
```
postgresql://dbadmin:YOUR_PASSWORD@saif-service-desk-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/service_tickets
```

#### 3. Run Migrations

```bash
# From local machine (with VPN/Bastion)
PGPASSWORD=YOUR_PASSWORD psql \
  -h saif-service-desk-db.xxxxxxxxx.us-east-1.rds.amazonaws.com \
  -U dbadmin \
  -d postgres \
  -c "CREATE DATABASE service_tickets;"

# Run migration scripts
for file in scripts/*.sql; do
  PGPASSWORD=YOUR_PASSWORD psql \
    -h saif-service-desk-db.xxxxxxxxx.us-east-1.rds.amazonaws.com \
    -U dbadmin \
    -d service_tickets \
    -f "$file"
done
```

#### 4. Deploy to ECS

Create `docker-compose.aws.yml`:

```yaml
version: '3.8'

services:
  app:
    image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/saif-service-desk:latest
    environment:
      - DATABASE_URL=${RDS_CONNECTION_STRING}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    ports:
      - "3000:3000"
```

Deploy:
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

docker build -t saif-service-desk .
docker tag saif-service-desk:latest ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/saif-service-desk:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/saif-service-desk:latest

# Deploy to ECS
aws ecs update-service --cluster your-cluster --service saif-service-desk --force-new-deployment
```

### Option 2: AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker saif-service-desk --region us-east-1

# Create environment with RDS
eb create saif-prod --database.engine postgres --database.username dbadmin

# Deploy
eb deploy
```

---

## Azure Deployment

### 1. Create Azure Database for PostgreSQL

```bash
# Create resource group
az group create --name saif-rg --location eastus

# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group saif-rg \
  --name saif-db-server \
  --location eastus \
  --admin-user dbadmin \
  --admin-password YOUR_SECURE_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32

# Create database
az postgres flexible-server db create \
  --resource-group saif-rg \
  --server-name saif-db-server \
  --database-name service_tickets
```

### 2. Configure Firewall

```bash
# Allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group saif-rg \
  --name saif-db-server \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow your IP for migrations
az postgres flexible-server firewall-rule create \
  --resource-group saif-rg \
  --name saif-db-server \
  --rule-name AllowMyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

### 3. Connection String

```
postgresql://dbadmin:YOUR_PASSWORD@saif-db-server.postgres.database.azure.com:5432/service_tickets?sslmode=require
```

### 4. Deploy to Azure App Service

```bash
# Create App Service plan
az appservice plan create \
  --name saif-plan \
  --resource-group saif-rg \
  --is-linux \
  --sku B1

# Create web app
az webapp create \
  --resource-group saif-rg \
  --plan saif-plan \
  --name saif-service-desk \
  --deployment-container-image-name saif-service-desk:latest

# Configure environment variables
az webapp config appsettings set \
  --resource-group saif-rg \
  --name saif-service-desk \
  --settings \
    DATABASE_URL="postgresql://dbadmin:YOUR_PASSWORD@saif-db-server.postgres.database.azure.com:5432/service_tickets?sslmode=require" \
    JWT_SECRET="your-secret" \
    NODE_ENV="production"

# Deploy
az webapp deployment source config \
  --name saif-service-desk \
  --resource-group saif-rg \
  --repo-url https://github.com/YOUR_USERNAME/service-ticket-system \
  --branch main \
  --manual-integration
```

---

## Google Cloud Deployment

### 1. Create Cloud SQL PostgreSQL

```bash
# Create instance
gcloud sql instances create saif-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_PASSWORD

# Create database
gcloud sql databases create service_tickets --instance=saif-db

# Create user
gcloud sql users create dbadmin \
  --instance=saif-db \
  --password=YOUR_PASSWORD
```

### 2. Connection String

```bash
# Get connection name
gcloud sql instances describe saif-db --format="value(connectionName)"
# Output: project-id:region:instance-name

# For Cloud Run (using Unix socket)
DATABASE_URL=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME

# For external connection
DATABASE_URL=postgresql://dbadmin:PASSWORD@INSTANCE_IP:5432/service_tickets
```

### 3. Deploy to Cloud Run

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/saif-service-desk

# Deploy to Cloud Run with Cloud SQL
gcloud run deploy saif-service-desk \
  --image gcr.io/PROJECT_ID/saif-service-desk \
  --platform managed \
  --region us-central1 \
  --add-cloudsql-instances PROJECT_ID:REGION:saif-db \
  --set-env-vars DATABASE_URL="postgresql://dbadmin:PASSWORD@/service_tickets?host=/cloudsql/PROJECT_ID:REGION:saif-db" \
  --set-env-vars JWT_SECRET="your-secret" \
  --allow-unauthenticated
```

---

## Vercel + Managed Database

### 1. Choose Database Provider

**Option A: Vercel Postgres**
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Create Postgres database
vercel postgres create
```

**Option B: Supabase**
```bash
# Create project at https://supabase.com
# Get connection string from Settings → Database
```

**Option C: Neon**
```bash
# Create project at https://neon.tech
# Get connection string
```

### 2. Update Database Configuration

Create `lib/db.vercel.ts`:

```typescript
import { Pool } from '@vercel/postgres'

export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})
```

### 3. Deploy to Vercel

```bash
# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET

# Deploy
vercel --prod
```

### 4. Run Migrations

Create `scripts/migrate.ts`:

```typescript
import { pool } from '../lib/db'
import { readFileSync } from 'fs'
import { join } from 'path'

async function migrate() {
  const files = [
    '01-create-schema.sql',
    '02-seed-data.sql',
    // ... add all migration files
  ]

  for (const file of files) {
    const sql = readFileSync(join(__dirname, file), 'utf-8')
    await pool.query(sql)
    console.log(`✓ ${file}`)
  }
  
  await pool.end()
}

migrate().catch(console.error)
```

Run:
```bash
npm run migrate
```

---

## Railway Deployment

### 1. Create Project

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Add PostgreSQL
railway add --database postgres
```

### 2. Get Connection String

```bash
railway variables
# Copy DATABASE_URL
```

### 3. Deploy

```bash
# Set environment variables
railway variables set JWT_SECRET=your-secret

# Deploy
railway up
```

### 4. Run Migrations

```bash
# Connect to database
railway connect postgres

# Run migrations
\i scripts/01-create-schema.sql
\i scripts/02-seed-data.sql
```

---

## DigitalOcean Deployment

### 1. Create Managed Database

```bash
# Using doctl CLI
doctl databases create saif-db \
  --engine pg \
  --region nyc1 \
  --size db-s-1vcpu-1gb \
  --version 16

# Get connection details
doctl databases connection saif-db
```

### 2. Deploy to App Platform

Create `app.yaml`:

```yaml
name: saif-service-desk
services:
- name: web
  github:
    repo: YOUR_USERNAME/service-ticket-system
    branch: main
  build_command: npm run build
  run_command: npm start
  envs:
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
  - key: JWT_SECRET
    value: ${JWT_SECRET}
  http_port: 3000
databases:
- name: db
  engine: PG
  version: "16"
```

Deploy:
```bash
doctl apps create --spec app.yaml
```

---

## Connection Pooling

### Using PgBouncer (Recommended for Production)

#### 1. Install PgBouncer

```bash
# Docker
docker run -d \
  --name pgbouncer \
  -e DATABASE_URL="postgres://user:pass@host:5432/dbname" \
  -e POOL_MODE=transaction \
  -e MAX_CLIENT_CONN=100 \
  -p 6432:6432 \
  edoburu/pgbouncer
```

#### 2. Update Connection String

```env
# Direct connection (for migrations)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Pooled connection (for app)
DATABASE_URL=postgresql://user:pass@pgbouncer:6432/dbname
```

### Using Prisma Accelerate (Alternative)

```typescript
import { Pool } from '@prisma/extension-accelerate'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
```

---

## SSL/TLS Configuration

### Update `lib/db.ts` for SSL

```typescript
import { Pool } from 'pg'
import fs from 'fs'

const sslConfig = process.env.NODE_ENV === 'production' ? {
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DB_CA_CERT || fs.readFileSync('./certs/ca-certificate.crt').toString(),
  }
} : {}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

### Environment Variables

```env
# For managed databases with SSL
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# With custom CA certificate
DB_CA_CERT=/path/to/ca-cert.pem
```

---

## Migration Strategy

### 1. Create Migration Runner

Create `scripts/run-migrations.js`:

```javascript
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })

  try {
    const files = fs.readdirSync(__dirname)
      .filter(f => f.endsWith('.sql'))
      .sort()

    console.log('🚀 Running migrations...')

    for (const file of files) {
      console.log(`📄 Executing ${file}...`)
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf-8')
      await pool.query(sql)
      console.log(`✅ ${file} completed`)
    }

    console.log('🎉 All migrations completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigrations()
```

### 2. Add to package.json

```json
{
  "scripts": {
    "migrate": "node scripts/run-migrations.js",
    "migrate:prod": "NODE_ENV=production node scripts/run-migrations.js"
  }
}
```

### 3. Run Migrations

```bash
# Local
npm run migrate

# Production
DATABASE_URL="your-cloud-db-url" npm run migrate:prod
```

---

## Environment Variables Checklist

### Required for Cloud Deployment

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Application
NODE_ENV=production
PORT=3000

# Optional
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/app/uploads
```

---

## Health Check Endpoint

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    await pool.query('SELECT 1')
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    }, { status: 503 })
  }
}
```

---

## Monitoring & Logging

### 1. Database Connection Monitoring

```typescript
// lib/db.ts
pool.on('connect', () => {
  console.log('Database connected')
})

pool.on('error', (err) => {
  console.error('Database error:', err)
})

pool.on('remove', () => {
  console.log('Client removed from pool')
})
```

### 2. Query Logging (Development)

```typescript
const originalQuery = pool.query.bind(pool)

pool.query = async (...args) => {
  const start = Date.now()
  try {
    const result = await originalQuery(...args)
    const duration = Date.now() - start
    console.log(`Query executed in ${duration}ms`)
    return result
  } catch (error) {
    console.error('Query error:', error)
    throw error
  }
}
```

---

## Troubleshooting

### Connection Timeout

```typescript
// Increase timeout
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000, // 5 seconds
})
```

### Too Many Connections

```typescript
// Reduce max connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Lower limit
})
```

### SSL Certificate Issues

```env
# Disable SSL verification (not recommended for production)
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require&ssl=true&sslmode=no-verify
```

---

## Cost Optimization

### Database Sizing

| Users | Recommended Size | Provider Example |
|-------|-----------------|------------------|
| <100 | 1GB RAM, 1 vCPU | AWS db.t3.micro |
| 100-500 | 2GB RAM, 1 vCPU | AWS db.t3.small |
| 500-2000 | 4GB RAM, 2 vCPU | AWS db.t3.medium |
| 2000+ | 8GB+ RAM, 4+ vCPU | AWS db.m5.large |

### Free Tier Options

- **Supabase**: 500MB database, 2GB bandwidth
- **Neon**: 3GB storage, 1 project
- **Railway**: $5 credit/month
- **Vercel Postgres**: 256MB storage (hobby)

---

## Security Best Practices

1. ✅ **Use SSL/TLS** for all database connections
2. ✅ **Rotate credentials** regularly
3. ✅ **Use IAM authentication** when available
4. ✅ **Enable connection pooling**
5. ✅ **Implement rate limiting**
6. ✅ **Use secrets management** (AWS Secrets Manager, Azure Key Vault)
7. ✅ **Enable database backups**
8. ✅ **Monitor connection metrics**
9. ✅ **Use private networking** (VPC peering)
10. ✅ **Implement query timeouts**

---

**Your application is now ready for cloud deployment! 🚀**
