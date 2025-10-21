import { ForgotPasswordForm } from "@/components/forgot-password-form"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/tickets")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <ForgotPasswordForm />
    </div>
  )
}
