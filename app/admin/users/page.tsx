import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Header } from "@/components/header"
import { UserManagementTable } from "@/components/admin/user-management-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft, UserPlus } from "lucide-react"
import Link from "next/link"

export default async function UsersManagementPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "admin") {
    redirect("/tickets")
  }

  // Fetch all users
  const users = await sql`
    SELECT 
      id, 
      email, 
      full_name, 
      role,
      agent_tier,
      created_at,
      updated_at
    FROM users
    ORDER BY created_at DESC
  `

  // Get user statistics
  const stats = await sql`
    SELECT 
      role,
      COUNT(*) as count
    FROM users
    GROUP BY role
  `

  const userStats = stats.reduce((acc: any, stat: any) => {
    acc[stat.role] = parseInt(stat.count)
    return acc
  }, {})

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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">User Management</h1>
              <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
            </div>
            <Button asChild>
              <Link href="/admin/users/new">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Link>
            </Button>
          </div>

          {/* User Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border rounded-lg p-4">
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="text-2xl font-bold">{userStats.admin || 0}</div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="text-2xl font-bold">{userStats.agent || 0}</div>
              <div className="text-sm text-muted-foreground">Agents</div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="text-2xl font-bold">{userStats.customer || 0}</div>
              <div className="text-sm text-muted-foreground">Customers</div>
            </div>
          </div>
        </div>

        <UserManagementTable users={users} currentUserId={user.id} />
      </main>
    </div>
  )
}
