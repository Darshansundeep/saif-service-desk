import { ResetPasswordForm } from "@/components/reset-password-form"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { validateResetToken } from "@/app/actions/password-reset"

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const user = await getCurrentUser()

  if (user) {
    redirect("/tickets")
  }

  const params = await searchParams
  const token = params.token

  if (!token) {
    redirect("/forgot-password")
  }

  // Validate token
  const validation = await validateResetToken(token)

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <ResetPasswordForm 
        token={token} 
        isValid={validation.valid}
        error={validation.error}
        email={validation.email}
      />
    </div>
  )
}
