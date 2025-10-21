"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { createTicket } from "@/app/actions/tickets"
import { Upload, X, UserPlus } from "lucide-react"
import type { User } from "@/lib/db"

interface CreateTicketFormProps {
  agents: Array<{ id: string; full_name: string; email: string }>
  currentUser: User
}

export function CreateTicketForm({ agents, currentUser }: CreateTicketFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError("")

    // Add files to formData
    files.forEach((file) => {
      formData.append("attachments", file)
    })

    const result = await createTicket(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push(`/tickets/${result.ticketId}`)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" required placeholder="Brief description of the issue" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              required
              rows={6}
              placeholder="Provide detailed information about the issue..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requestor_email">Requestor Email ID *</Label>
              <Input 
                id="requestor_email" 
                name="requestor_email" 
                type="email"
                required 
                placeholder="requestor@example.com" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestor_phone">Requestor Phone Number *</Label>
              <Input 
                id="requestor_phone" 
                name="requestor_phone" 
                type="tel"
                required 
                placeholder="+1 (555) 123-4567" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue_type">Issue Type *</Label>
              <Select name="issue_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="change_request">Change Request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="users_affected">No. of Users Affected *</Label>
              <Input 
                id="users_affected" 
                name="users_affected" 
                type="number"
                min="1"
                defaultValue="1"
                required 
                placeholder="1" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(currentUser.role === 'agent' || currentUser.role === 'admin') && (
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign To</Label>
                <Select name="assigned_to" defaultValue={currentUser.id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name} {agent.id === currentUser.id ? '(Me)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments</Label>
            <div className="flex items-center gap-2">
              <Input id="attachments" type="file" multiple onChange={handleFileChange} className="hidden" />
              <Button type="button" variant="outline" onClick={() => document.getElementById("attachments")?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
              <span className="text-sm text-muted-foreground">{files.length} file(s) selected</span>
            </div>

            {files.length > 0 && (
              <div className="mt-2 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Ticket"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
