# Quick Start Guide - Local Development

Get up and running in **5 minutes**! 🚀

## Prerequisites Check

```bash
# Check Node.js (need v18+)
node --version

# Check if PostgreSQL is installed
psql --version
```

Don't have them? Install:
- **Node.js**: https://nodejs.org/
- **PostgreSQL**: See installation below

---

## Step 1: Install PostgreSQL (2 minutes)

### macOS:
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows:
Download from https://www.postgresql.org/download/windows/

---

## Step 2: Create Database (1 minute)

```bash
# Connect to PostgreSQL
psql postgres

# Run these commands (copy-paste all at once):
CREATE DATABASE service_tickets;
CREATE USER ticket_admin WITH PASSWORD 'dev123';
GRANT ALL PRIVILEGES ON DATABASE service_tickets TO ticket_admin;
\q
```

---

## Step 3: Run Database Migrations (30 seconds)

```bash
# Navigate to project directory
cd /Users/darshansangaraju/Downloads/service-ticket-system

# Run schema creation
psql -U ticket_admin -d service_tickets -f scripts/01-create-schema.sql

# (Optional) Add sample data
psql -U ticket_admin -d service_tickets -f scripts/02-seed-data.sql
```

If prompted for password, enter: `dev123`

---

## Step 4: Configure Environment (30 seconds)

Create `.env.local` file in project root:

```bash
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://ticket_admin:dev123@localhost:5432/service_tickets
JWT_SECRET=my-super-secret-jwt-key-for-development
EOF
```

---

## Step 5: Install & Run (1 minute)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Step 6: Access the App

Open your browser: **http://localhost:3000**

### Default Login Credentials:
- **Admin**: admin@example.com / password123
- **Agent**: agent1@example.com / password123
- **Customer**: customer@example.com / password123

---

## Verify Everything Works

### Test Database Connection:
```bash
psql -U ticket_admin -d service_tickets -c "SELECT COUNT(*) FROM users;"
```
Should show: `count: 4` (if you ran seed data)

### Test File Uploads:
1. Login to the app
2. Create a new ticket
3. Upload a file
4. Check `public/uploads/` directory - file should be there!

---

## Common Issues

### "Connection refused" error
**Problem:** PostgreSQL not running

**Fix:**
```bash
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### "Database does not exist"
**Problem:** Skipped Step 2

**Fix:** Run Step 2 again

### "Module not found" errors
**Problem:** Dependencies not installed

**Fix:**
```bash
npm install
```

### Port 3000 already in use
**Fix:** Use different port
```bash
npm run dev -- -p 3001
```

---

## What's Next?

✅ **Explore the app** - Create tickets, add comments, upload files  
✅ **Read the docs** - Check `LOCAL_SETUP.md` for detailed info  
✅ **Customize** - Modify the code to fit your needs  
✅ **Deploy** - When ready, deploy to production  

---

## File Structure

```
service-ticket-system/
├── .env.local              # Your config (created in Step 4)
├── public/uploads/         # Uploaded files stored here
├── scripts/
│   ├── 01-create-schema.sql  # Database schema
│   └── 02-seed-data.sql      # Sample data
├── lib/
│   ├── db.ts              # Database connection (works with local PG!)
│   └── file-storage.ts    # Local file upload handler
└── app/                   # Next.js application
```

---

## Need Help?

- 📖 **Detailed Setup**: See `LOCAL_SETUP.md`
- 🗄️ **Database Options**: See `DATABASE_OPTIONS.md`
- 📋 **Migration Info**: See `MIGRATION_SUMMARY.md`
- 📝 **Main Docs**: See `README.md`

---

## Development Tips

### View Database Data:
```bash
psql -U ticket_admin -d service_tickets
\dt                    # List tables
SELECT * FROM users;   # View users
SELECT * FROM tickets; # View tickets
\q                     # Quit
```

### Clear Uploaded Files:
```bash
rm -rf public/uploads/*
touch public/uploads/.gitkeep
```

### Reset Database:
```bash
psql -U ticket_admin -d service_tickets -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql -U ticket_admin -d service_tickets -f scripts/01-create-schema.sql
psql -U ticket_admin -d service_tickets -f scripts/02-seed-data.sql
```

---

**You're all set! Happy coding! 🎉**
