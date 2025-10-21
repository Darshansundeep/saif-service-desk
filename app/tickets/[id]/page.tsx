import { getCurrentUser } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { sql } from "@/lib/db"
import { Header } from "@/components/header"
import { TicketDetail } from "@/components/ticket-detail"
import { notFound } from 'next/navigation'
import type { Ticket, Comment, Attachment } from "@/lib/db"
import { getTicketSLA, calculateSLAStatus } from "@/lib/sla"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: PageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const { id } = await params

  // Get ticket with creator and assignee info
  const tickets = (await sql`
    SELECT 
      t.*,
      u1.full_name as creator_name,
      u1.email as creator_email,
      u2.full_name as assignee_name,
      u2.email as assignee_email
    FROM tickets t
    LEFT JOIN users u1 ON t.created_by = u1.id
    LEFT JOIN users u2 ON t.assigned_to = u2.id
    WHERE t.id = ${id}
  `) as Ticket[]

  if (tickets.length === 0) {
    notFound()
  }

  const ticket = tickets[0]

  // Check permissions - customers can only view their own tickets
  if (user.role === "customer" && ticket.created_by !== user.id) {
    redirect("/tickets")
  }

  // Get comments
  const comments = (await sql`
    SELECT 
      c.*,
      u.full_name as user_name,
      u.role as user_role
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.ticket_id = ${id}
    ORDER BY c.created_at ASC
  `) as Comment[]

  // Get attachments
  const attachments = (await sql`
    SELECT 
      a.*,
      u.full_name as uploader_name
    FROM attachments a
    LEFT JOIN users u ON a.uploaded_by = u.id
    WHERE a.ticket_id = ${id}
    ORDER BY a.created_at DESC
  `) as Attachment[]

  // Get all agents for assignment dropdown
  const agents = await sql`
    SELECT id, full_name, email, agent_tier
    FROM users
    WHERE role IN ('agent', 'admin')
    ORDER BY 
      CASE 
        WHEN agent_tier = 'L1' THEN 1
        WHEN agent_tier = 'L2' THEN 2
        ELSE 3
      END,
      full_name
  `

  // Get SLA tracking for this ticket
  const slaTracking = await getTicketSLA(id)
  const slaStatus = slaTracking ? calculateSLAStatus(slaTracking) : null

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <TicketDetail
          ticket={ticket}
          comments={comments}
          attachments={attachments}
          agents={agents}
          currentUser={user}
          slaTracking={slaTracking}
          slaStatus={slaStatus}
        />
      </main>
    </div>
  )
}
