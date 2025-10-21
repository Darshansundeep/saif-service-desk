# Service Ticket System

A full-featured service ticket management system similar to Jira, built with Next.js 15, PostgreSQL, and TypeScript.

## Features

### Authentication & Authorization
- JWT-based authentication with secure password hashing (bcrypt)
- Role-based access control (Customer, Agent, Admin)
- Protected routes with middleware

### Ticket Management
- Create tickets with title, description, priority, and file attachments
- View tickets (role-based: customers see only their tickets)
- Update ticket status with workflow transitions
- Assign tickets to agents
- File attachments using Vercel Blob storage

### Status Workflow
- **New** → Open
- **Open** → In Progress or Closed
- **In Progress** → Resolved or Open
- **Resolved** → Closed or Open
- **Closed** → Open

### Comments & Collaboration
- Add comments to tickets
- Real-time comment updates
- Participant notifications

### Search & Filtering
- Search by title and description
- Filter by status, priority, and assignee
- Role-based filtering

### Notifications
- In-app notifications
- Real-time notification polling (10s interval)
- Notifications for:
  - New tickets (to agents)
  - Status changes (to ticket creator)
  - Assignments (to assignee)
  - New comments (to participants)

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL (local with `pg` library)
- **Authentication**: JWT (jose), bcrypt
- **File Storage**: Local file system (`public/uploads/`)
- **UI**: shadcn/ui, Tailwind CSS v4
- **Data Fetching**: SWR for client-side

## Database Schema

\`\`\`sql
users (id, email, password_hash, full_name, role, created_at, updated_at)
tickets (id, title, description, priority, status, created_by, assigned_to, created_at, updated_at)
comments (id, ticket_id, user_id, content, created_at)
attachments (id, ticket_id, file_name, file_url, file_size, uploaded_by, created_at)
notifications (id, user_id, ticket_id, message, read, created_at)
\`\`\`

## Setup Instructions

> **🚀 QUICK START: See [QUICK_START.md](./QUICK_START.md) - Get running in 5 minutes!**
> 
> **📝 Detailed Setup: See [LOCAL_SETUP.md](./LOCAL_SETUP.md) for comprehensive local development guide**

### 1. Database Setup

This application uses **local PostgreSQL** with connection pooling via the `pg` library.

Install PostgreSQL locally and create the database:

\`\`\`bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
\`\`\`

Create database:
\`\`\`bash
psql postgres
CREATE DATABASE service_tickets;
CREATE USER ticket_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE service_tickets TO ticket_admin;
\q
\`\`\`

### 2. Run Database Migrations

Execute the SQL scripts in order:

1. `scripts/01-create-schema.sql` - Creates tables, indexes, and triggers
2. `scripts/02-seed-data.sql` - (Optional) Seeds sample users

You can run these scripts using your PostgreSQL client or directly in your database dashboard.

### 3. Environment Variables

Create a `.env.local` file in the project root:

\`\`\`env
# Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/service_tickets

# JWT secret for authentication
JWT_SECRET=your-secret-key-change-in-production

# Optional: Max file upload size (default: 10MB)
MAX_FILE_SIZE=10485760
\`\`\`

**Notes:** 
- Files are stored locally in `public/uploads/` (no cloud storage)
- Database uses local PostgreSQL with connection pooling
- All data stays on your machine

### 4. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 5. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` to see the application.

## Default Users (from seed data)

After running the seed script, you can login with:

- **Admin**: admin@example.com / password123
- **Agent 1**: agent1@example.com / password123
- **Agent 2**: agent2@example.com / password123
- **Customer**: customer@example.com / password123

**Note**: The seed script uses placeholder password hashes. You should create new users via the signup page for proper password hashing.

## User Roles & Permissions

### Customer
- Create tickets
- View own tickets only
- Comment on own tickets
- Receive notifications

### Agent
- View all tickets
- Assign tickets to self or others
- Update ticket status
- Comment on any ticket
- Search and filter tickets
- Receive notifications

### Admin
- All agent permissions
- Full system access
- Manage users (via database)

## API Routes

- `POST /api/notifications` - Get user notifications (authenticated)

## Server Actions

- `signUp(formData)` - Create new user account
- `signIn(formData)` - Authenticate user
- `signOut()` - Sign out user
- `createTicket(formData)` - Create new ticket with attachments
- `updateTicketStatus(ticketId, status)` - Update ticket status
- `assignTicket(ticketId, assigneeId)` - Assign ticket to agent
- `addComment(ticketId, content)` - Add comment to ticket
- `markNotificationRead(notificationId)` - Mark notification as read
- `markAllNotificationsRead()` - Mark all notifications as read

## Project Structure

\`\`\`
app/
├── actions/
│   ├── auth.ts          # Authentication actions
│   └── tickets.ts       # Ticket management actions
├── api/
│   └── notifications/   # Notifications API
├── login/               # Login page
├── signup/              # Signup page
├── tickets/
│   ├── page.tsx         # Tickets list
│   ├── new/             # Create ticket
│   └── [id]/            # Ticket detail
├── layout.tsx
└── page.tsx             # Home (redirects)

components/
├── ui/                  # shadcn/ui components
├── auth-form.tsx
├── header.tsx
├── notification-dropdown.tsx
├── ticket-list.tsx
├── ticket-filters.tsx
├── ticket-detail.tsx
├── status-transition.tsx
├── assignment-dropdown.tsx
├── comment-section.tsx
└── create-ticket-form.tsx

lib/
├── db.ts               # Database client & types
├── auth.ts             # Authentication utilities
└── utils.ts            # Utility functions

scripts/
├── 01-create-schema.sql
└── 02-seed-data.sql
\`\`\`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables (DATABASE_URL, JWT_SECRET)
4. Deploy

The Blob storage is already configured via the integration.

## Security Considerations

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- HTTP-only cookies for auth tokens
- Row-level security via application logic
- SQL injection protection via parameterized queries
- File upload size limits (handled by Vercel Blob)

## Future Enhancements

- Email notifications (currently in-app only)
- Real-time updates via WebSockets/Supabase Realtime
- Ticket templates
- SLA tracking
- Advanced reporting and analytics
- Bulk operations
- Ticket tags/labels
- Custom fields
- Audit logs

## License

MIT
