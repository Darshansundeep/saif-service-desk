import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { CreateTicketForm } from "@/components/create-ticket-form"
import { sql } from "@/lib/db"

export default async function NewTicketPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Get all agents for assignment dropdown
  const agents = await sql`
    SELECT id, full_name, email
    FROM users
    WHERE role IN ('agent', 'admin')
    ORDER BY full_name
  `

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold">Create New Ticket</h2>
          <p className="text-muted-foreground mt-1">Describe your issue and we'll help you resolve it</p>
        </div>

        <CreateTicketForm agents={agents} currentUser={user} />
      </main>
    </div>
  )
}
