import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getSettings } from "@/app/actions/settings"
import { Header } from "@/components/header"
import { SettingsForm } from "@/components/admin/settings-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "admin") {
    redirect("/tickets")
  }

  const { settings, error } = await getSettings()

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
          <h1 className="text-4xl font-bold mb-2">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
        </div>

        {error ? (
          <div className="text-destructive">{error}</div>
        ) : (
          <SettingsForm initialSettings={settings || {}} />
        )}
      </main>
    </div>
  )
}
