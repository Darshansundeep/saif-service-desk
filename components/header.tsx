import { getCurrentUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/actions/auth"
import { NotificationDropdown } from "./notification-dropdown"
import { CompanyLogoServer } from "./company-logo-server"
import { Ticket, Shield } from "lucide-react"
import Link from "next/link"

export async function Header() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/tickets" className="hover:opacity-80 transition-opacity">
          <CompanyLogoServer size="sm" showText={true} />
        </Link>

        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Welcome, </span>
            <span className="font-medium">{user.full_name}</span>
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {user.role === 'agent' && user.agent_tier 
                ? `${user.agent_tier} Agent` 
                : user.role === 'agent' 
                ? 'Agent' 
                : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href="/tickets">
              <Ticket className="h-4 w-4 mr-2" />
              Tickets
            </Link>
          </Button>

          {user.role === "admin" && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Link>
            </Button>
          )}

          <NotificationDropdown />

          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
