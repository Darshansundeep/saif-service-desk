import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { Header } from "@/components/header"
import { TicketList } from "@/components/ticket-list"
import { TicketFilters } from "@/components/ticket-filters"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import type { Ticket } from "@/lib/db"

interface PageProps {
  searchParams: Promise<{
    status?: string
    priority?: string
    assignee?: string
    search?: string
    page?: string
  }>
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const params = await searchParams
  const { status, priority, assignee, search, page } = params
  const currentPage = parseInt(page || '1')
  const itemsPerPage = 10

  // Build dynamic query
  let query = `
    SELECT 
      t.*,
      u1.full_name as creator_name,
      u2.full_name as assignee_name
    FROM tickets t
    LEFT JOIN users u1 ON t.created_by = u1.id
    LEFT JOIN users u2 ON t.assigned_to = u2.id
    WHERE 1=1
  `

  const queryParams: any[] = []

  // Role-based filtering
  if (user.role === "customer") {
    query += ` AND t.created_by = $${queryParams.length + 1}`
    queryParams.push(user.id)
  } else if (user.role === "agent") {
    // Agents only see tickets assigned to them
    query += ` AND t.assigned_to = $${queryParams.length + 1}`
    queryParams.push(user.id)
  }
  // Admins see all tickets (no additional filter)

  // Status filter
  if (status) {
    query += ` AND t.status = $${queryParams.length + 1}`
    queryParams.push(status)
  }

  // Priority filter
  if (priority) {
    query += ` AND t.priority = $${queryParams.length + 1}`
    queryParams.push(priority)
  }

  // Assignee filter
  if (assignee) {
    if (assignee === "unassigned") {
      query += ` AND t.assigned_to IS NULL`
    } else {
      query += ` AND t.assigned_to = $${queryParams.length + 1}`
      queryParams.push(assignee)
    }
  }

  // Search filter
  if (search) {
    query += ` AND (t.title ILIKE $${queryParams.length + 1} OR t.description ILIKE $${queryParams.length + 1})`
    queryParams.push(`%${search}%`)
  }

  // Custom ordering: new/open, escalated, in_progress, resolved, cancelled
  query += ` 
    ORDER BY 
      CASE t.status
        WHEN 'new' THEN 1
        WHEN 'open' THEN 1
        WHEN 'escalated' THEN 2
        WHEN 'in_progress' THEN 3
        WHEN 'resolved' THEN 4
        WHEN 'cancelled' THEN 5
        ELSE 6
      END,
      t.created_at DESC
  `

  // Get total count for pagination
  const countQuery = query.replace(
    /SELECT[\s\S]*?FROM/,
    'SELECT COUNT(*) as total FROM'
  ).replace(/ORDER BY[\s\S]*$/, '')
  
  const countResult = await sql(countQuery, queryParams)
  const totalTickets = parseInt(countResult[0]?.total || '0')
  const totalPages = Math.ceil(totalTickets / itemsPerPage)

  // Add pagination
  const offset = (currentPage - 1) * itemsPerPage
  query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
  queryParams.push(itemsPerPage, offset)

  const tickets = (await sql(query, queryParams)) as Ticket[]

  // Get status counts for filter blocks
  let statusCountQuery = `
    SELECT 
      t.status,
      COUNT(*) as count
    FROM tickets t
    WHERE 1=1
  `
  const statusCountParams: any[] = []
  
  if (user.role === "customer") {
    statusCountQuery += ` AND t.created_by = $${statusCountParams.length + 1}`
    statusCountParams.push(user.id)
  } else if (user.role === "agent") {
    statusCountQuery += ` AND t.assigned_to = $${statusCountParams.length + 1}`
    statusCountParams.push(user.id)
  }
  
  statusCountQuery += ` GROUP BY t.status`
  
  const statusCounts = await sql(statusCountQuery, statusCountParams)
  const statusCountMap: Record<string, number> = {}
  statusCounts.forEach((row: any) => {
    statusCountMap[row.status] = parseInt(row.count)
  })

  // Get all agents for filter dropdown
  const agents = await sql`
    SELECT id, full_name
    FROM users
    WHERE role IN ('agent', 'admin')
    ORDER BY full_name
  `

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">Tickets</h2>
            <p className="text-muted-foreground mt-1">Manage and track service tickets</p>
          </div>

          <Button asChild>
            <Link href="/tickets/new">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Link>
          </Button>
        </div>

        <TicketFilters 
          agents={agents} 
          currentRole={user.role} 
          statusCounts={statusCountMap}
          currentStatus={status}
        />

        <TicketList 
          tickets={tickets} 
          currentUser={user} 
          currentPage={currentPage}
          totalPages={totalPages}
          totalTickets={totalTickets}
        />
      </main>
    </div>
  )
}
