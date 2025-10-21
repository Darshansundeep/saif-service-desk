"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createUser } from "@/app/actions/admin"

export function CreateUserForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [role, setRole] = useState("customer")
  const [agentTier, setAgentTier] = useState<"L1" | "L2">("L1")
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError("")

    formData.set("role", role)
    if (role === "agent") {
      formData.set("agent_tier", agentTier)
    }
    const result = await createUser(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push("/admin/users")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Details</CardTitle>
        <CardDescription>Enter the information for the new user</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              name="full_name"
              required
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Minimum 8 characters"
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {role === "customer" && "Can create and view own tickets"}
              {role === "agent" && "Can view all tickets, assign, and update status"}
              {role === "admin" && "Full system access including user management"}
            </p>
          </div>

          {role === "agent" && (
            <div className="space-y-2">
              <Label htmlFor="agent_tier">Agent Tier *</Label>
              <Select value={agentTier} onValueChange={(value) => setAgentTier(value as "L1" | "L2")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L1">L1 - Level 1 Support</SelectItem>
                  <SelectItem value="L2">L2 - Level 2 Support</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {agentTier === "L1" && "First line of support - handles initial ticket triage and basic issues"}
                {agentTier === "L2" && "Advanced support - handles escalated and complex issues"}
              </p>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
