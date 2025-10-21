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
export async function sql(
  strings: TemplateStringsArray | string,
  ...values: any[]
): Promise<any[]> {
  const client = await pool.connect()
  try {
    let query: string
    let params: any[]

    // Handle both tagged template literals and direct string queries
    if (typeof strings === 'string') {
      // Direct query with parameters array
      query = strings
      params = values[0] || []
    } else {
      // Tagged template literal
      query = ""
      params = []
      
      for (let i = 0; i < strings.length; i++) {
        query += strings[i]
        if (i < values.length) {
          params.push(values[i])
          query += `$${params.length}`
        }
      }
    }

    const result = await client.query(query, params)
    return result.rows
  } finally {
    client.release()
  }
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

export type UserRole = "customer" | "agent" | "admin"
export type AgentTier = "L1" | "L2"
export type TicketPriority = "low" | "medium" | "high" | "critical"
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed" | "escalated"

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  agent_tier?: AgentTier | null
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
  requestor_email: string | null
  requestor_phone: string | null
  issue_type: string | null
  users_affected: number | null
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
