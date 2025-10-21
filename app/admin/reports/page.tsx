import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Header } from "@/components/header"
import { ReportsDashboard } from "@/components/admin/reports-dashboard"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"

export default async function ReportsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "admin") {
    redirect("/tickets")
  }

  // Ticket statistics
  const ticketStats = await sql`
    SELECT 
      COUNT(*) as total_tickets,
      COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
      COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
      COUNT(CASE WHEN status = 'escalated' THEN 1 END) as escalated_tickets,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets
    FROM tickets
  `

  // Priority distribution
  const priorityStats = await sql`
    SELECT 
      priority,
      COUNT(*) as count
    FROM tickets
    GROUP BY priority
    ORDER BY 
      CASE priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END
  `

  // Issue type distribution
  const issueTypeStats = await sql`
    SELECT 
      issue_type,
      COUNT(*) as count
    FROM tickets
    WHERE issue_type IS NOT NULL
    GROUP BY issue_type
    ORDER BY count DESC
  `

  // Tickets by agent
  const agentStats = await sql`
    SELECT 
      u.full_name,
      u.email,
      COUNT(t.id) as assigned_tickets,
      COUNT(CASE WHEN t.status = 'resolved' THEN 1 END) as resolved_tickets,
      COUNT(CASE WHEN t.status = 'closed' THEN 1 END) as closed_tickets
    FROM users u
    LEFT JOIN tickets t ON u.id = t.assigned_to
    WHERE u.role IN ('agent', 'admin')
    GROUP BY u.id, u.full_name, u.email
    ORDER BY assigned_tickets DESC
  `

  // Recent activity
  const recentTickets = await sql`
    SELECT 
      t.id,
      t.title,
      t.status,
      t.priority,
      t.created_at,
      u.full_name as creator_name
    FROM tickets t
    LEFT JOIN users u ON t.created_by = u.id
    ORDER BY t.created_at DESC
    LIMIT 10
  `

  // Tickets created over time (last 30 days)
  const ticketTrend = await sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM tickets
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `

  // Users affected statistics
  const impactStats = await sql`
    SELECT 
      SUM(users_affected) as total_users_affected,
      AVG(users_affected) as avg_users_affected,
      MAX(users_affected) as max_users_affected
    FROM tickets
    WHERE users_affected IS NOT NULL
  `

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Reports & Analytics</h1>
              <p className="text-muted-foreground">System-wide statistics and insights</p>
            </div>
            <Button asChild>
              <Link href="/admin/reports/detailed">
                <FileText className="h-4 w-4 mr-2" />
                Detailed Report
              </Link>
            </Button>
          </div>
        </div>

        <ReportsDashboard
          ticketStats={ticketStats[0]}
          priorityStats={priorityStats}
          issueTypeStats={issueTypeStats}
          agentStats={agentStats}
          recentTickets={recentTickets}
          ticketTrend={ticketTrend}
          impactStats={impactStats[0]}
        />
      </main>
    </div>
  )
}
