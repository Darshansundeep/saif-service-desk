"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requestPasswordReset } from "@/app/actions/password-reset"
import { CompanyLogo } from "./company-logo"
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string; resetLink?: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMessage(null)

    const result = await requestPasswordReset(formData)

    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ 
        type: "success", 
        text: result.message || "Password reset link sent",
        resetLink: result.resetLink
      })
    }
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4">
        <div className="flex justify-center">
          <CompanyLogo size="lg" showText={true} layout="vertical" />
        </div>
        <div className="text-center">
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
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
                    Check your email inbox for the password reset link.
                  </p>
                )}
                {message.resetLink && process.env.NODE_ENV === 'development' && (
                  <div className="mt-3 p-2 bg-background/50 rounded text-xs">
                    <p className="font-semibold mb-1">Development Mode - Reset Link:</p>
                    <a 
                      href={message.resetLink} 
                      className="text-blue-500 hover:underline break-all"
                    >
                      {message.resetLink}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                asChild
              >
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setMessage(null)}
              >
                Send Another Link
              </Button>
            </div>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <Link 
                href="/login" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
