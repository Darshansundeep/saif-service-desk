import { AuthForm } from "@/components/auth-form"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CompanyLogoServer } from "@/components/company-logo-server"

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/tickets")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Logo in top left */}
      <div className="absolute top-6 left-6">
        <CompanyLogoServer size="md" showText={false} />
      </div>
      
      {/* Login form centered */}
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Company name above login card */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">SAIF</h1>
            <p className="text-lg text-muted-foreground">Service Desk</p>
          </div>
          
          <AuthForm mode="signin" />
        </div>
      </div>
    </div>
  )
}
