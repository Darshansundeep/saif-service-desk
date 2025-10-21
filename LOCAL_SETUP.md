# Local Development Setup Guide

This guide will help you set up the Service Ticket System with **local PostgreSQL database** and **local file storage** instead of cloud services.

## Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher) installed locally
- **pnpm** or **npm** package manager

## 1. Install PostgreSQL Locally

### macOS (using Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

## 2. Create Database and User

Connect to PostgreSQL:
```bash
psql postgres
```

Create database and user:
```sql
CREATE DATABASE service_tickets;
CREATE USER ticket_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE service_tickets TO ticket_admin;
\q
```

## 3. Run Database Migrations

Connect to your new database:
```bash
psql -U ticket_admin -d service_tickets
```

Run the schema creation script:
```sql
\i scripts/01-create-schema.sql
```

(Optional) Seed sample data:
```sql
\i scripts/02-seed-data.sql
```

Exit psql:
```sql
\q
```

## 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Local PostgreSQL Connection
DATABASE_URL=postgresql://ticket_admin:your_password@localhost:5432/service_tickets

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Optional: Max file upload size (in bytes, default 10MB)
MAX_FILE_SIZE=10485760
```

**Note:** Replace `your_password` with the password you set in step 2.

## 5. Install Dependencies

```bash
npm install
# or
pnpm install
```

## 6. Create Upload Directory

The application will automatically create the upload directory, but you can create it manually:

```bash
mkdir -p public/uploads
```

## 7. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

Visit `http://localhost:3000` to see the application.

## File Storage

Files are now stored locally in the `public/uploads/` directory. They are accessible via the URL pattern:
```
http://localhost:3000/uploads/[filename]
```

### File Upload Features:
- Files are saved with timestamp prefixes to avoid naming conflicts
- Filenames are sanitized to remove special characters
- Files are publicly accessible through the `/uploads/` route
- No external blob storage service required

## Database Connection

The application uses the Neon serverless driver (`@neondatabase/serverless`), which is compatible with standard PostgreSQL databases. This means:

- ✅ Works with local PostgreSQL
- ✅ Works with remote PostgreSQL (AWS RDS, DigitalOcean, etc.)
- ✅ Works with Neon cloud database
- ✅ No code changes needed to switch between them

Simply update the `DATABASE_URL` in your `.env.local` file.

## Troubleshooting

### Database Connection Issues

If you get connection errors:

1. **Check PostgreSQL is running:**
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. **Verify connection string:**
   ```bash
   psql postgresql://ticket_admin:your_password@localhost:5432/service_tickets
   ```

3. **Check PostgreSQL logs:**
   ```bash
   # macOS
   tail -f /usr/local/var/log/postgresql@15.log
   
   # Linux
   sudo tail -f /var/log/postgresql/postgresql-15-main.log
   ```

### File Upload Issues

1. **Check directory permissions:**
   ```bash
   ls -la public/uploads
   chmod 755 public/uploads
   ```

2. **Check file size limits:**
   - Default limit is 10MB
   - Adjust `MAX_FILE_SIZE` in `.env.local` if needed

### Port Already in Use

If port 3000 is already in use:
```bash
npm run dev -- -p 3001
```

## Production Deployment

For production deployment with local setup:

1. **Set up PostgreSQL on your server**
2. **Configure environment variables** with production values
3. **Set up file backup** for `public/uploads/` directory
4. **Use a reverse proxy** (nginx/Apache) for better file serving
5. **Consider using a CDN** for uploaded files if needed

## Switching Back to Cloud Services

If you want to switch back to Vercel Blob and Neon cloud:

1. Install Vercel Blob: `npm install @vercel/blob`
2. Update `lib/file-storage.ts` to use Vercel Blob
3. Update `DATABASE_URL` to point to Neon cloud database
4. Redeploy to Vercel

## Default Users (from seed data)

After running the seed script:

- **Admin**: admin@example.com / password123
- **Agent 1**: agent1@example.com / password123
- **Agent 2**: agent2@example.com / password123
- **Customer**: customer@example.com / password123

**Security Note:** Change these passwords in production!
