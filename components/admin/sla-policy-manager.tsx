"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from "lucide-react"
import { createSLAPolicy, updateSLAPolicy, deleteSLAPolicy, toggleSLAPolicyStatus } from "@/app/actions/sla"

interface SLAPolicyManagerProps {
  policies: any[]
}

export function SLAPolicyManager({ policies }: SLAPolicyManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`
  }

  const handleCreatePolicy = async (formData: FormData) => {
    setLoading(true)
    setMessage(null)

    const result = await createSLAPolicy(formData)

    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: result.message || "Policy created successfully" })
      setIsCreateOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  const handleUpdatePolicy = async (formData: FormData) => {
    setLoading(true)
    setMessage(null)

    const result = await updateSLAPolicy(formData)

    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: result.message || "Policy updated successfully" })
      setEditingPolicy(null)
      router.refresh()
    }
    setLoading(false)
  }

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm("Are you sure you want to delete this SLA policy?")) return

    setLoading(true)
    setMessage(null)

    const result = await deleteSLAPolicy(policyId)

    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: result.message || "Policy deleted successfully" })
      router.refresh()
    }
    setLoading(false)
  }

  const handleToggleStatus = async (policyId: string, currentStatus: boolean) => {
    setLoading(true)
    setMessage(null)

    const result = await toggleSLAPolicyStatus(policyId, !currentStatus)

    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: result.message || "Status updated successfully" })
      router.refresh()
    }
    setLoading(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 text-red-500'
      case 'high': return 'border-orange-500 text-orange-500'
      case 'medium': return 'border-blue-500 text-blue-500'
      case 'low': return 'border-gray-500 text-gray-500'
      default: return 'border-gray-500 text-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SLA Policy Management</h2>
          <p className="text-muted-foreground">Create and manage SLA policies for different priorities</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create SLA Policy</DialogTitle>
              <DialogDescription>
                Define response and resolution times for a priority level
              </DialogDescription>
            </DialogHeader>
            <PolicyForm onSubmit={handleCreatePolicy} loading={loading} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded ${
          message.type === "success" 
            ? "bg-green-500/10 text-green-500" 
            : "bg-destructive/10 text-destructive"
        }`}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Policies List */}
      <div className="grid grid-cols-1 gap-4">
        {policies.map((policy) => (
          <Card key={policy.id} className={!policy.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">{policy.name}</CardTitle>
                    <Badge variant="outline" className={getPriorityColor(policy.priority)}>
                      {policy.priority}
                    </Badge>
                    {policy.is_active ? (
                      <Badge variant="outline" className="border-green-500 text-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-500 text-gray-500">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                  {policy.description && (
                    <CardDescription>{policy.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingPolicy(policy)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit SLA Policy</DialogTitle>
                        <DialogDescription>
                          Update policy settings
                        </DialogDescription>
                      </DialogHeader>
                      <PolicyForm 
                        policy={policy} 
                        onSubmit={handleUpdatePolicy} 
                        loading={loading} 
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(policy.id, policy.is_active)}
                    disabled={loading}
                  >
                    {policy.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePolicy(policy.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Response Time</div>
                    <div className="text-2xl font-bold text-blue-500">
                      {formatMinutes(policy.response_time_minutes)}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Resolution Time</div>
                    <div className="text-2xl font-bold text-green-500">
                      {formatMinutes(policy.resolution_time_minutes)}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Escalation Time</div>
                    <div className="text-2xl font-bold text-orange-500">
                      {policy.escalation_time_minutes 
                        ? formatMinutes(policy.escalation_time_minutes)
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Business Hours</div>
                    <div className="text-sm font-medium mt-1">
                      {policy.business_hours_only ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {policies.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No SLA policies found. Create one to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface PolicyFormProps {
  policy?: any
  onSubmit: (formData: FormData) => void
  loading: boolean
}

function PolicyForm({ policy, onSubmit, loading }: PolicyFormProps) {
  const [businessHoursOnly, setBusinessHoursOnly] = useState(policy?.business_hours_only ?? true)
  const [isActive, setIsActive] = useState(policy?.is_active ?? true)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("business_hours_only", businessHoursOnly.toString())
    formData.set("is_active", isActive.toString())
    if (policy) {
      formData.set("id", policy.id)
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Policy Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={policy?.name}
          placeholder="e.g., Critical Priority SLA"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={policy?.description}
          placeholder="Brief description of this policy"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority Level *</Label>
        <Select name="priority" defaultValue={policy?.priority || "medium"} required>
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="response_time_minutes">Response Time (minutes) *</Label>
          <Input
            id="response_time_minutes"
            name="response_time_minutes"
            type="number"
            min="1"
            defaultValue={policy?.response_time_minutes}
            placeholder="e.g., 60"
            required
          />
          <p className="text-xs text-muted-foreground">Time to first agent response</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resolution_time_minutes">Resolution Time (minutes) *</Label>
          <Input
            id="resolution_time_minutes"
            name="resolution_time_minutes"
            type="number"
            min="1"
            defaultValue={policy?.resolution_time_minutes}
            placeholder="e.g., 480"
            required
          />
          <p className="text-xs text-muted-foreground">Time to resolve ticket</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="escalation_time_minutes">Escalation Time (minutes)</Label>
        <Input
          id="escalation_time_minutes"
          name="escalation_time_minutes"
          type="number"
          min="1"
          defaultValue={policy?.escalation_time_minutes || ''}
          placeholder="e.g., 240 (optional)"
        />
        <p className="text-xs text-muted-foreground">Time before auto-escalation (optional)</p>
      </div>

      <div className="flex items-center justify-between border rounded-lg p-4">
        <div className="space-y-0.5">
          <Label>Business Hours Only</Label>
          <p className="text-sm text-muted-foreground">
            Only count time during business hours
          </p>
        </div>
        <Switch
          checked={businessHoursOnly}
          onCheckedChange={setBusinessHoursOnly}
        />
      </div>

      {policy && (
        <div className="flex items-center justify-between border rounded-lg p-4">
          <div className="space-y-0.5">
            <Label>Active Policy</Label>
            <p className="text-sm text-muted-foreground">
              Enable or disable this policy
            </p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      )}

      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : policy ? "Update Policy" : "Create Policy"}
        </Button>
      </DialogFooter>
    </form>
  )
}
