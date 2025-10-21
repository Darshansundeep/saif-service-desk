import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, BarChart3, Settings, ListChecks, ScrollText, Plus, Ticket, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "admin") {
    redirect("/tickets")
  }

  const adminCards = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      href: "/admin/users",
      color: "text-blue-500",
    },
    {
      title: "Ticket Queues",
      description: "View and manage agent ticket assignments",
      icon: ListChecks,
      href: "/admin/ticket-queues",
      color: "text-cyan-500",
    },
    {
      title: "Reports",
      description: "Generate and view system reports",
      icon: FileText,
      href: "/admin/reports",
      color: "text-green-500",
    },
    {
      title: "Analytics",
      description: "View ticket statistics and trends",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "text-purple-500",
    },
    {
      title: "System Settings",
      description: "Configure system settings",
      icon: Settings,
      href: "/admin/settings",
      color: "text-orange-500",
    },
    {
      title: "Audit Logs",
      description: "View system activity and changes",
      icon: ScrollText,
      href: "/admin/audit-logs",
      color: "text-red-500",
    },
    {
      title: "SLA Management",
      description: "Monitor and manage Service Level Agreements",
      icon: Clock,
      href: "/admin/sla",
      color: "text-indigo-500",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
              <p className="text-muted-foreground">Manage your service ticket system</p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/tickets">
                  <Ticket className="h-4 w-4 mr-2" />
                  View Tickets
                </Link>
              </Button>
              <Button asChild variant="default">
                <Link href="/tickets/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminCards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.href} href={card.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <Icon className={`h-8 w-8 mb-2 ${card.color}`} />
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
