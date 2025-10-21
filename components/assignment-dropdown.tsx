"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { UserIcon } from 'lucide-react'
import { assignTicket } from "@/app/actions/tickets"
import { useRouter } from 'next/navigation'
import { useState } from "react"

interface AssignmentDropdownProps {
  ticketId: string
  currentAssignee: string | null
  agents: Array<{ id: string; full_name: string; email: string; agent_tier?: string | null }>
  currentUserId: string
  currentUserRole: 'customer' | 'agent' | 'admin'
}

export function AssignmentDropdown({ ticketId, currentAssignee, agents, currentUserId, currentUserRole }: AssignmentDropdownProps) {
  const [loading, setLoading] = useState(false)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [pendingAssignee, setPendingAssignee] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleAssign(assigneeId: string | null) {
    // Agents must provide a note when reassigning
    if (currentUserRole === 'agent' && currentAssignee === currentUserId) {
      setPendingAssignee(assigneeId)
      setShowNoteDialog(true)
      return
    }
    
    // Admin can assign directly
    setLoading(true)
    const result = await assignTicket(ticketId, assigneeId)
    if (result.error) {
      setError(result.error)
    }
    setLoading(false)
    router.refresh()
  }
  
  async function handleConfirmReassign() {
    if (!note.trim()) {
      setError('Please add a note explaining why you\'re reassigning this ticket')
      return
    }
    
    setLoading(true)
    const result = await assignTicket(ticketId, pendingAssignee, note)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    
    setLoading(false)
    setShowNoteDialog(false)
    setNote('')
    setPendingAssignee(null)
    router.refresh()
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          <UserIcon className="h-4 w-4 mr-2" />
          {currentAssignee ? "Reassign" : "Assign"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleAssign(currentUserId)}>Assign to me</DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* L1 Agents */}
        {agents.filter(a => a.agent_tier === 'L1').length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">L1 - Level 1 Support</div>
            {agents.filter(a => a.agent_tier === 'L1').map((agent) => (
              <DropdownMenuItem
                key={agent.id}
                onClick={() => handleAssign(agent.id)}
                disabled={agent.id === currentAssignee}
              >
                <div className="flex flex-col">
                  <span>{agent.full_name}</span>
                  <span className="text-xs text-muted-foreground">{agent.email}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* L2 Agents */}
        {agents.filter(a => a.agent_tier === 'L2').length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">L2 - Level 2 Support</div>
            {agents.filter(a => a.agent_tier === 'L2').map((agent) => (
              <DropdownMenuItem
                key={agent.id}
                onClick={() => handleAssign(agent.id)}
                disabled={agent.id === currentAssignee}
              >
                <div className="flex flex-col">
                  <span>{agent.full_name}</span>
                  <span className="text-xs text-muted-foreground">{agent.email}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Agents without tier (legacy/admin) */}
        {agents.filter(a => !a.agent_tier).length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Other Agents</div>
            {agents.filter(a => !a.agent_tier).map((agent) => (
              <DropdownMenuItem
                key={agent.id}
                onClick={() => handleAssign(agent.id)}
                disabled={agent.id === currentAssignee}
              >
                <div className="flex flex-col">
                  <span>{agent.full_name}</span>
                  <span className="text-xs text-muted-foreground">{agent.email}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {currentAssignee && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAssign(null)} className="text-destructive">
              Unassign
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    
    <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Reassignment Note</DialogTitle>
          <DialogDescription>
            Please explain why you're reassigning this ticket. This note will be added to the ticket comments.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reassign-note">Note *</Label>
            <Textarea
              id="reassign-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Reassigning to L2 support for advanced troubleshooting..."
              rows={4}
            />
          </div>
          
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {error}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowNoteDialog(false)
              setNote('')
              setError('')
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirmReassign} disabled={loading}>
            {loading ? 'Reassigning...' : 'Confirm Reassignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
