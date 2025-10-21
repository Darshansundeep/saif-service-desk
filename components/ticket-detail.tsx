"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { Ticket, Comment, Attachment, User } from "@/lib/db"
import type { SLAStatus } from "@/lib/sla"
import { ArrowLeft, Calendar, UserIcon, Paperclip } from 'lucide-react'
import Link from "next/link"
import { StatusTransition } from "./status-transition"
import { AssignmentDropdown } from "./assignment-dropdown"
import { CommentSection } from "./comment-section"
import { SLAIndicator } from "./sla-indicator"

interface TicketDetailProps {
  ticket: Ticket & {
    creator_name?: string
    creator_email?: string
    assignee_name?: string
    assignee_email?: string
  }
  comments: Comment[]
  attachments: Attachment[]
  agents: Array<{ id: string; full_name: string; email: string }>
  currentUser: User
  slaTracking?: any
  slaStatus?: SLAStatus | null
}

const statusColors = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  open: "bg-green-500/10 text-green-500 border-green-500/20",
  in_progress: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  resolved: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  escalated: "bg-red-500/10 text-red-500 border-red-500/20",
}

const priorityColors = {
  low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
}

export function TicketDetail({ ticket, comments, attachments, agents, currentUser, slaTracking, slaStatus }: TicketDetailProps) {
  const canManageTicket = currentUser.role === "agent" || currentUser.role === "admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tickets">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-3">{ticket.title}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={statusColors[ticket.status]}>
                  {ticket.status.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className={priorityColors[ticket.priority]}>
                  {ticket.priority}
                </Badge>
              </div>
            </div>

            {canManageTicket && (
              <div className="flex gap-2">
                <StatusTransition 
                  ticketId={ticket.id} 
                  currentStatus={ticket.status}
                  userRole={currentUser.role}
                  isAssigned={!!ticket.assigned_to}
                  currentUserId={currentUser.id}
                  assignedToId={ticket.assigned_to}
                />
                <AssignmentDropdown
                  ticketId={ticket.id}
                  currentAssignee={ticket.assigned_to}
                  agents={agents}
                  currentUserId={currentUser.id}
                  currentUserRole={currentUser.role}
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* SLA Information */}
          {slaStatus && slaTracking && (
            <>
              <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-sm">SLA Tracking</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SLAIndicator
                    status={slaStatus.responseStatus}
                    timeRemaining={slaStatus.responseTimeRemaining}
                    progress={slaStatus.responseProgress}
                    type="response"
                  />
                  <SLAIndicator
                    status={slaStatus.resolutionStatus}
                    timeRemaining={slaStatus.resolutionTimeRemaining}
                    progress={slaStatus.resolutionProgress}
                    type="resolution"
                  />
                </div>
                {slaTracking.policy_name && (
                  <p className="text-xs text-muted-foreground">
                    Policy: {slaTracking.policy_name}
                  </p>
                )}
              </div>
              <Separator />
            </>
          )}

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created by:</span>
                <span className="font-medium">{ticket.creator_name}</span>
              </div>

              {ticket.assignee_name && (
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Assigned to:</span>
                  <span className="font-medium">{ticket.assignee_name}</span>
                </div>
              )}

              {ticket.requestor_email && (
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Requestor Email:</span>
                  <span className="font-medium">{ticket.requestor_email}</span>
                </div>
              )}

              {ticket.requestor_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Requestor Phone:</span>
                  <span className="font-medium">{ticket.requestor_phone}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(ticket.created_at).toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Updated:</span>
                <span>{new Date(ticket.updated_at).toLocaleString()}</span>
              </div>

              {ticket.issue_type && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Issue Type:</span>
                  <Badge variant="secondary">{ticket.issue_type.replace('_', ' ')}</Badge>
                </div>
              )}

              {ticket.users_affected && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Users Affected:</span>
                  <span className="font-medium">{ticket.users_affected}</span>
                </div>
              )}
            </div>
          </div>

          {attachments.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({attachments.length})
                </h3>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{attachment.file_name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : ""}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CommentSection ticketId={ticket.id} comments={comments} currentUser={currentUser} />
    </div>
  )
}
