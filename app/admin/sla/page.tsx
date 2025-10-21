import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { SLADashboard } from "@/components/admin/sla-dashboard"
import { SLAPolicyManager } from "@/components/admin/sla-policy-manager"
import { getSLAPolicies, getSLAMetrics, getBreachedTickets, getAtRiskTickets } from "@/lib/sla"
import { sql } from "@/lib/db"

export default async function SLAManagementPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "admin") {
    redirect("/tickets")
  }

  // Get SLA data
  const policies = await getSLAPolicies()
  const metrics = await getSLAMetrics()
  const breachedTickets = await getBreachedTickets()
  const atRiskTickets = await getAtRiskTickets()

  // Get all policies (including inactive) for management
  const allPolicies = await sql`
    SELECT * FROM sla_policies
    ORDER BY 
      CASE priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      created_at DESC
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
          <h1 className="text-4xl font-bold mb-2">SLA Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage Service Level Agreements
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="policies">Manage Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <SLADashboard
              policies={policies}
              metrics={metrics}
              breachedTickets={breachedTickets}
              atRiskTickets={atRiskTickets}
            />
          </TabsContent>

          <TabsContent value="policies">
            <SLAPolicyManager policies={allPolicies} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
