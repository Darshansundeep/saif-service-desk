"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from 'lucide-react'
import { updateTicketStatus } from "@/app/actions/tickets"
import { useRouter } from 'next/navigation'
import { useState } from "react"
import type { TicketStatus } from "@/lib/db"

interface StatusTransitionProps {
  ticketId: string
  currentStatus: TicketStatus
  userRole: string
  isAssigned: boolean
  currentUserId: string
  assignedToId: string | null
}

const statusFlow: Record<string, TicketStatus[]> = {
  new: ["open", "in_progress", "escalated"],
  open: ["in_progress", "escalated"],
  in_progress: ["resolved", "escalated", "open"],
  resolved: ["closed", "open"],
  closed: [],
  escalated: ["in_progress", "open"],
}

const statusLabels: Record<string, string> = {
  new: "New",
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
  escalated: "Escalated",
}

export function StatusTransition({ ticketId, currentStatus, userRole, isAssigned, currentUserId, assignedToId }: StatusTransitionProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Admins can change any ticket status
  // Agents can only change status of tickets assigned to them
  const canChangeStatus = userRole === "admin" || 
    (userRole === "agent" && assignedToId === currentUserId)
  
  // Ticket must be assigned before status can be changed
  if (!canChangeStatus || !isAssigned) {
    return null
  }

  const availableTransitions = statusFlow[currentStatus] || []

  async function handleStatusChange(newStatus: TicketStatus) {
    setLoading(true)
    await updateTicketStatus(ticketId, newStatus)
    setLoading(false)
    router.refresh()
  }

  if (availableTransitions.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          Change Status
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableTransitions.map((status) => (
          <DropdownMenuItem key={status} onClick={() => handleStatusChange(status)}>
            {statusLabels[status]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
