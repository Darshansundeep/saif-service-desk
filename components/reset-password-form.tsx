"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { resetPassword } from "@/app/actions/password-reset"
import { CompanyLogo } from "./company-logo"
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

interface ResetPasswordFormProps {
  token: string
  isValid: boolean
  error?: string
  email?: string
}

export function ResetPasswordForm({ token, isValid, error, email }: ResetPasswordFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMessage(null)

    formData.append("token", token)

    const result = await resetPassword(formData)

    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: result.message || "Password reset successful" })
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    }
    setLoading(false)
  }

  if (!isValid) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <CompanyLogo size="lg" showText={true} layout="vertical" />
          </div>
          <div className="text-center">
            <CardTitle>Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 text-destructive mb-4">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
              <p className="text-xs mt-2 opacity-80">
                Please request a new password reset link.
              </p>
            </div>
          </div>

          <Button className="w-full" asChild>
            <Link href="/forgot-password">
              Request New Reset Link
            </Link>
          </Button>

          <div className="text-center mt-4">
            <Link 
              href="/login" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4">
        <div className="flex justify-center">
          <CompanyLogo size="lg" showText={true} layout="vertical" />
        </div>
        <div className="text-center">
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            {email && `Resetting password for ${email}`}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {message ? (
          <div className="space-y-4">
            <div className={`flex items-start gap-3 p-4 rounded-lg ${
              message.type === "success" 
                ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                : "bg-destructive/10 text-destructive"
            }`}>
              {message.type === "success" ? (
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{message.text}</p>
                {message.type === "success" && (
                  <p className="text-xs mt-2 opacity-80">
                    Redirecting to login page...
                  </p>
                )}
              </div>
            </div>

            {message.type === "success" && (
              <Button className="w-full" asChild>
                <Link href="/login">
                  Go to Login
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter new password"
                  className="pl-10 pr-10"
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Confirm new password"
                  className="pl-10 pr-10"
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>

            <div className="text-center">
              <Link 
                href="/login" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
