# PostgreSQL Database Options

This application supports **two different PostgreSQL configurations**. Choose the one that best fits your needs.

## Option 1: Neon Serverless Driver (Current - Recommended for Flexibility)

**File:** `lib/db.ts` (already configured)

### Pros:
✅ Works with **both local and cloud** PostgreSQL  
✅ **No code changes** needed to switch between environments  
✅ Lightweight and fast  
✅ Edge-compatible (works on Vercel Edge Runtime)  
✅ Simple configuration  

### Cons:
❌ Requires WebSocket support (some firewalls may block)  
❌ Less traditional than standard `pg` library  

### Setup:

1. **Install dependencies** (already in package.json):
   ```bash
   npm install @neondatabase/serverless
   ```

2. **Set DATABASE_URL** in `.env.local`:
   ```env
   # For local PostgreSQL
   DATABASE_URL=postgresql://postgres:password@localhost:5432/service_tickets
   
   # For Neon Cloud
   DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname
   
   # For AWS RDS, DigitalOcean, etc.
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```

3. **No code changes needed** - it just works!

### When to use:
- ✅ You want flexibility to switch between local/cloud easily
- ✅ You're deploying to Vercel or edge environments
- ✅ You want a simple, modern approach
- ✅ You're okay with WebSocket connections

---

## Option 2: Standard PostgreSQL Driver (Traditional)

**File:** `lib/db-local.ts` (alternative implementation)

### Pros:
✅ Traditional PostgreSQL connection pooling  
✅ More control over connection settings  
✅ Works with all PostgreSQL versions  
✅ No WebSocket requirements  
✅ Better for long-running Node.js servers  

### Cons:
❌ Not edge-compatible (won't work on Vercel Edge)  
❌ Requires more configuration  
❌ Slightly more complex setup  

### Setup:

1. **Install dependencies**:
   ```bash
   npm install pg @types/pg
   ```

2. **Switch to local driver** - Update all imports:
   ```typescript
   // Change this:
   import { sql } from "@/lib/db"
   
   // To this:
   import { sql } from "@/lib/db-local"
   ```

3. **Set DATABASE_URL** in `.env.local`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/service_tickets
   ```

4. **Update imports** in these files:
   - `lib/auth.ts`
   - `app/actions/auth.ts`
   - `app/actions/tickets.ts`
   - `app/api/notifications/route.ts`
   - Any other files importing from `@/lib/db`

### When to use:
- ✅ You're running on a traditional Node.js server
- ✅ You need connection pooling control
- ✅ You're behind a firewall that blocks WebSockets
- ✅ You prefer the standard PostgreSQL approach

---

## Comparison Table

| Feature | Neon Serverless (`db.ts`) | Standard PG (`db-local.ts`) |
|---------|---------------------------|----------------------------|
| **Local PostgreSQL** | ✅ Yes | ✅ Yes |
| **Cloud PostgreSQL** | ✅ Yes | ✅ Yes |
| **Edge Runtime** | ✅ Yes | ❌ No |
| **Connection Pooling** | Built-in | ✅ Configurable |
| **WebSocket Required** | ✅ Yes | ❌ No |
| **Setup Complexity** | 🟢 Simple | 🟡 Moderate |
| **Code Changes to Switch** | None | Update imports |

---

## Recommended Approach

### For Most Users (Current Setup):
**Use Option 1 (Neon Serverless)** - It's already configured and works great!

```env
# .env.local
DATABASE_URL=postgresql://postgres:password@localhost:5432/service_tickets
```

Just run:
```bash
npm install
npm run dev
```

### For Traditional Setups:
**Use Option 2 (Standard PG)** if you need connection pooling or can't use WebSockets.

---

## Local PostgreSQL Installation

Regardless of which option you choose, you need PostgreSQL installed locally:

### macOS (Homebrew):
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
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

---

## Creating the Database

1. **Connect to PostgreSQL**:
   ```bash
   psql postgres
   ```

2. **Create database and user**:
   ```sql
   CREATE DATABASE service_tickets;
   CREATE USER ticket_admin WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE service_tickets TO ticket_admin;
   \q
   ```

3. **Run migrations**:
   ```bash
   psql -U ticket_admin -d service_tickets -f scripts/01-create-schema.sql
   psql -U ticket_admin -d service_tickets -f scripts/02-seed-data.sql
   ```

4. **Update .env.local**:
   ```env
   DATABASE_URL=postgresql://ticket_admin:your_secure_password@localhost:5432/service_tickets
   ```

---

## Testing the Connection

Create a test script to verify your database connection:

```bash
# Create test file
cat > test-db.js << 'EOF'
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function test() {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result[0].current_time);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

test();
EOF

# Run test
node test-db.js
```

---

## Switching Between Options

### From Neon Serverless to Standard PG:

1. **Find and replace** in all files:
   ```bash
   # macOS/Linux
   find . -name "*.ts" -type f -exec sed -i '' 's/@\/lib\/db/@\/lib\/db-local/g' {} +
   
   # Or manually update imports in:
   # - lib/auth.ts
   # - app/actions/auth.ts
   # - app/actions/tickets.ts
   # - app/api/notifications/route.ts
   ```

2. **Restart dev server**:
   ```bash
   npm run dev
   ```

### From Standard PG to Neon Serverless:

1. **Reverse the process** - change imports back to `@/lib/db`

2. **Restart dev server**

---

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** PostgreSQL is not running
```bash
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### Authentication Failed
```
Error: password authentication failed for user "ticket_admin"
```
**Solution:** Check your password in `.env.local` matches the database user

### Database Does Not Exist
```
Error: database "service_tickets" does not exist
```
**Solution:** Create the database:
```bash
psql postgres -c "CREATE DATABASE service_tickets;"
```

### WebSocket Connection Failed (Neon Serverless)
```
Error: WebSocket connection failed
```
**Solution:** 
- Check firewall settings
- Or switch to Option 2 (Standard PG)

---

## My Recommendation

**Stick with the current setup (Neon Serverless)** because:

1. ✅ Already configured and working
2. ✅ No code changes needed
3. ✅ Works with local PostgreSQL perfectly
4. ✅ Easy to deploy to Vercel later
5. ✅ Simpler to maintain

Just make sure PostgreSQL is installed and running locally, and you're good to go!
