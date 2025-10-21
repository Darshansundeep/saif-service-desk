import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Header } from "@/components/header"
import { TicketQueuesView } from "@/components/admin/ticket-queues-view"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function TicketQueuesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "admin") {
    redirect("/tickets")
  }

  // Get all agents with their ticket counts
  const agents = await sql`
    SELECT 
      u.id,
      u.full_name,
      u.email,
      u.agent_tier,
      COUNT(CASE WHEN t.status NOT IN ('resolved', 'closed') THEN 1 END) as active_tickets,
      COUNT(CASE WHEN t.status = 'open' THEN 1 END) as open_tickets,
      COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tickets,
      COUNT(t.id) as total_assigned
    FROM users u
    LEFT JOIN tickets t ON t.assigned_to = u.id
    WHERE u.role IN ('agent', 'admin')
    GROUP BY u.id, u.full_name, u.email, u.agent_tier
    ORDER BY 
      CASE 
        WHEN u.agent_tier = 'L1' THEN 1
        WHEN u.agent_tier = 'L2' THEN 2
        ELSE 3
      END,
      u.full_name
  `

  // Get all tickets with assignment info
  const tickets = await sql`
    SELECT 
      t.id,
      t.title,
      t.priority,
      t.status,
      t.issue_type,
      t.created_at,
      t.assigned_to,
      t.requestor_email,
      assignee.full_name as assigned_to_name,
      assignee.agent_tier as assigned_to_tier,
      creator.full_name as created_by_name
    FROM tickets t
    LEFT JOIN users assignee ON t.assigned_to = assignee.id
    LEFT JOIN users creator ON t.created_by = creator.id
    WHERE t.status NOT IN ('resolved', 'closed')
    ORDER BY 
      CASE t.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      t.created_at DESC
  `

  // Get unassigned tickets
  const unassignedTickets = tickets.filter((t: any) => !t.assigned_to)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Ticket Queues</h1>
          <p className="text-muted-foreground">
            View and manage ticket assignments across all agents
          </p>
        </div>

        <TicketQueuesView 
          agents={agents} 
          tickets={tickets}
          unassignedTickets={unassignedTickets}
        />
      </main>
    </div>
  )
}
