import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Header } from "@/components/header"
import { DetailedReportTable } from "@/components/admin/detailed-report-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function DetailedReportPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "admin") {
    redirect("/tickets")
  }

  // Fetch detailed ticket data with all required information
  const detailedTickets = await sql`
    SELECT 
      t.id,
      t.title,
      t.description,
      t.priority,
      t.status,
      t.issue_type,
      t.users_affected,
      t.requestor_email,
      t.requestor_phone,
      t.created_at,
      t.updated_at,
      creator.full_name as created_by_name,
      creator.email as created_by_email,
      creator.role as created_by_role,
      assignee.full_name as assigned_to_name,
      assignee.email as assigned_to_email,
      -- Get ticket creator from first comment
      (
        SELECT u.full_name || ' (' || u.email || ')'
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.ticket_id = t.id
        AND c.content LIKE 'Ticket created by%'
        ORDER BY c.created_at ASC
        LIMIT 1
      ) as ticket_creator,
      -- Count reassignments (status changes to different agents)
      (
        SELECT COUNT(DISTINCT user_id) 
        FROM comments 
        WHERE ticket_id = t.id 
        AND content LIKE '%assigned%'
      ) as reassignment_count,
      -- Get closed date (when status changed to closed)
      (
        SELECT created_at 
        FROM comments 
        WHERE ticket_id = t.id 
        AND content LIKE '%closed%'
        ORDER BY created_at DESC 
        LIMIT 1
      ) as closed_date,
      -- Calculate resolution time in hours
      CASE 
        WHEN t.status IN ('resolved', 'closed') THEN
          EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/3600
        ELSE NULL
      END as resolution_hours
    FROM tickets t
    LEFT JOIN users creator ON t.created_by = creator.id
    LEFT JOIN users assignee ON t.assigned_to = assignee.id
    ORDER BY t.created_at DESC
  `

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/reports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Detailed Ticket Report</h1>
          <p className="text-muted-foreground">
            Comprehensive line-item details for all tickets
          </p>
        </div>

        <DetailedReportTable tickets={detailedTickets} />
      </main>
    </div>
  )
}
