import { Pool } from "pg"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// Create a connection pool for local PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Helper function to execute SQL queries with tagged template literals
// This mimics the Neon serverless API for compatibility
export async function sql(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<any[]> {
  const client = await pool.connect()
  try {
    // Build the query from template strings
    let query = strings[0]
    const params: any[] = []
    
    for (let i = 0; i < values.length; i++) {
      params.push(values[i])
      query += `$${i + 1}` + strings[i + 1]
    }

    const result = await client.query(query, params)
    return result.rows
  } finally {
    client.release()
  }
}

// Export types (same as before)
export type UserRole = "customer" | "agent" | "admin"
export type TicketPriority = "low" | "medium" | "high" | "critical"
export type TicketStatus = "new" | "open" | "in_progress" | "resolved" | "closed"

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  created_by: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  creator_name?: string
  assignee_name?: string
}

export interface Comment {
  id: string
  ticket_id: string
  user_id: string
  content: string
  created_at: string
  user_name?: string
}

export interface Attachment {
  id: string
  ticket_id: string
  file_name: string
  file_url: string
  file_size: number | null
  uploaded_by: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  ticket_id: string | null
  message: string
  read: boolean
  created_at: string
}

// Graceful shutdown
process.on("SIGINT", async () => {
  await pool.end()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await pool.end()
  process.exit(0)
})
