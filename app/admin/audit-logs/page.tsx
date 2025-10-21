import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getRecentActivity } from "@/lib/audit-log"
import { Header } from "@/components/header"
import { AuditLogViewer } from "@/components/admin/audit-log-viewer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function AuditLogsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "admin") {
    redirect("/tickets")
  }

  // Get recent audit logs
  const auditLogs = await getRecentActivity(200)

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
          <h1 className="text-4xl font-bold mb-2">Audit Logs</h1>
          <p className="text-muted-foreground">
            Complete audit trail of all system changes and activities
          </p>
        </div>

        <AuditLogViewer initialLogs={auditLogs} />
      </main>
    </div>
  )
}
