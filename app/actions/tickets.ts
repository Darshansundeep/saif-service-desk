"use server"

import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { TicketPriority, TicketStatus } from "@/lib/db"
import { uploadFile } from "@/lib/file-storage"
import { sendTicketAcknowledgment } from "@/lib/email"
import { logTicketChange } from "@/lib/audit-log"

export async function createTicket(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const priority = (formData.get("priority") as TicketPriority) || "medium"
  const requestorEmail = formData.get("requestor_email") as string
  const requestorPhone = formData.get("requestor_phone") as string
  const issueType = formData.get("issue_type") as string
  const usersAffected = parseInt(formData.get("users_affected") as string) || 1
  const assignedTo = formData.get("assigned_to") as string | null

  if (!title || !description || !requestorEmail || !requestorPhone || !issueType) {
    return { error: "All required fields must be filled" }
  }

  try {
    // Determine assigned_to value
    // If agent/admin creates ticket, auto-assign to them unless they explicitly choose otherwise
    let assignee: string | null = null
    
    if (user.role === 'agent' || user.role === 'admin') {
      // Auto-assign to creator if they didn't specify or if they chose themselves
      if (!assignedTo || assignedTo === user.id) {
        assignee = user.id
      } else if (assignedTo !== 'unassigned') {
        assignee = assignedTo
      }
    }
    
    const tickets = await sql`
      INSERT INTO tickets (title, description, priority, status, requestor_email, requestor_phone, issue_type, users_affected, created_by, assigned_to)
      VALUES (${title}, ${description}, ${priority}, 'new', ${requestorEmail}, ${requestorPhone}, ${issueType}, ${usersAffected}, ${user.id}, ${assignee})
      RETURNING id
    `

    const ticketId = tickets[0].id

    // Handle file attachments
    const files = formData.getAll("attachments") as File[]
    for (const file of files) {
      if (file.size > 0) {
        const { url, size } = await uploadFile(file)

        await sql`
          INSERT INTO attachments (ticket_id, file_name, file_url, file_size, uploaded_by)
          VALUES (${ticketId}, ${file.name}, ${url}, ${size}, ${user.id})
        `
      }
    }

    // Log who created the ticket in comments
    await sql`
      INSERT INTO comments (ticket_id, user_id, content)
      VALUES (
        ${ticketId}, 
        ${user.id}, 
        ${`Ticket created by ${user.full_name} (${user.email}) on behalf of ${requestorEmail}`}
      )
    `

    // Create notification for assigned agent or all agents
    if (assignee) {
      // Notify only the assigned agent
      await sql`
        INSERT INTO notifications (user_id, ticket_id, message)
        VALUES (${assignee}, ${ticketId}, ${`New ticket assigned to you: ${title}`})
      `
    } else {
      // Notify all agents if unassigned
      const agents = await sql`
        SELECT id FROM users WHERE role IN ('agent', 'admin')
      `

      for (const agent of agents) {
        await sql`
          INSERT INTO notifications (user_id, ticket_id, message)
          VALUES (${agent.id}, ${ticketId}, ${`New ticket created: ${title}`})
        `
      }
    }

    // Send acknowledgment email to requestor
    try {
      await sendTicketAcknowledgment(ticketId, title, requestorEmail)
      console.log(`[Ticket] Acknowledgment email sent to ${requestorEmail}`)
    } catch (emailError) {
      console.error('[Ticket] Failed to send acknowledgment email:', emailError)
      // Don't fail ticket creation if email fails
    }

    // Log ticket creation
    await logTicketChange(
      "CREATE",
      ticketId,
      user,
      undefined,
      { title, priority, status: "new", requestor_email: requestorEmail, issue_type: issueType, assigned_to: assignee },
      `Ticket created: ${title}`
    )

    revalidatePath("/tickets")
    return { success: true, ticketId }
  } catch (error) {
    console.error("[v0] Create ticket error:", error)
    return { error: "Failed to create ticket" }
  }
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  if (user.role === "customer") {
    return { error: "Only agents and admins can update ticket status" }
  }

  try {
    // Get old status and assignment for audit log
    const oldTicket = await sql`
      SELECT status, title, assigned_to FROM tickets WHERE id = ${ticketId}
    `
    const oldStatus = oldTicket[0]?.status
    const assignedTo = oldTicket[0]?.assigned_to
    
    // Agents can only update status of tickets assigned to them
    if (user.role === 'agent' && assignedTo !== user.id) {
      return { error: "You can only update status of tickets assigned to you" }
    }

    await sql`
      UPDATE tickets
      SET status = ${status}
      WHERE id = ${ticketId}
    `

    // Notify ticket creator
    const tickets = await sql`
      SELECT created_by, title FROM tickets WHERE id = ${ticketId}
    `

    if (tickets.length > 0) {
      await sql`
        INSERT INTO notifications (user_id, ticket_id, message)
        VALUES (${tickets[0].created_by}, ${ticketId}, ${`Ticket status updated to ${status}: ${tickets[0].title}`})
      `
    }

    // Log status change
    await logTicketChange(
      "STATUS_CHANGE",
      ticketId,
      user,
      { status: oldStatus },
      { status },
      `Status changed from ${oldStatus} to ${status}`
    )

    revalidatePath("/tickets")
    revalidatePath(`/tickets/${ticketId}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Update ticket status error:", error)
    return { error: "Failed to update ticket status" }
  }
}

export async function assignTicket(ticketId: string, assigneeId: string | null, note?: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  if (user.role === "customer") {
    return { error: "Only agents and admins can assign tickets" }
  }

  try {
    // Get old assignment for audit log
    const oldTicket = await sql`
      SELECT assigned_to, title FROM tickets WHERE id = ${ticketId}
    `
    const oldAssigneeId = oldTicket[0]?.assigned_to
    
    // Agent permission check: can only reassign tickets assigned to them
    if (user.role === 'agent' && oldAssigneeId !== user.id) {
      return { error: "You can only reassign tickets that are assigned to you" }
    }
    
    // Agents must add a note when reassigning
    if (user.role === 'agent' && (!note || note.trim() === '')) {
      return { error: "Please add a note explaining why you're reassigning this ticket" }
    }

    await sql`
      UPDATE tickets
      SET assigned_to = ${assigneeId}
      WHERE id = ${ticketId}
    `
    
    // Add note as comment if provided (required for agents)
    if (note && note.trim()) {
      await sql`
        INSERT INTO comments (ticket_id, user_id, content)
        VALUES (${ticketId}, ${user.id}, ${note})
      `
    }

    // Notify assignee
    if (assigneeId) {
      const tickets = await sql`
        SELECT title FROM tickets WHERE id = ${ticketId}
      `

      if (tickets.length > 0) {
        await sql`
          INSERT INTO notifications (user_id, ticket_id, message)
          VALUES (${assigneeId}, ${ticketId}, ${`You have been assigned to ticket: ${tickets[0].title}`})
        `
      }
    }

    // Get assignee names for audit log
    let oldAssigneeName = "Unassigned"
    let newAssigneeName = "Unassigned"

    if (oldAssigneeId) {
      const oldUser = await sql`SELECT full_name FROM users WHERE id = ${oldAssigneeId}`
      oldAssigneeName = oldUser[0]?.full_name || "Unknown"
    }

    if (assigneeId) {
      const newUser = await sql`SELECT full_name FROM users WHERE id = ${assigneeId}`
      newAssigneeName = newUser[0]?.full_name || "Unknown"
    }

    // Log assignment change
    const action = oldAssigneeId ? "REASSIGN" : "ASSIGN"
    await logTicketChange(
      action,
      ticketId,
      user,
      { assigned_to: oldAssigneeId, assigned_to_name: oldAssigneeName },
      { assigned_to: assigneeId, assigned_to_name: newAssigneeName },
      `Ticket ${action === "ASSIGN" ? "assigned" : "reassigned"} from ${oldAssigneeName} to ${newAssigneeName}`
    )

    revalidatePath("/tickets")
    revalidatePath(`/tickets/${ticketId}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Assign ticket error:", error)
    return { error: "Failed to assign ticket" }
  }
}

export async function addComment(ticketId: string, content: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  if (!content.trim()) {
    return { error: "Comment cannot be empty" }
  }

  try {
    await sql`
      INSERT INTO comments (ticket_id, user_id, content)
      VALUES (${ticketId}, ${user.id}, ${content})
    `

    // Notify ticket participants
    const participants = await sql`
      SELECT DISTINCT u.id
      FROM users u
      WHERE u.id IN (
        SELECT created_by FROM tickets WHERE id = ${ticketId}
        UNION
        SELECT assigned_to FROM tickets WHERE id = ${ticketId} AND assigned_to IS NOT NULL
        UNION
        SELECT user_id FROM comments WHERE ticket_id = ${ticketId}
      )
      AND u.id != ${user.id}
    `

    const tickets = await sql`
      SELECT title FROM tickets WHERE id = ${ticketId}
    `

    for (const participant of participants) {
      await sql`
        INSERT INTO notifications (user_id, ticket_id, message)
        VALUES (${participant.id}, ${ticketId}, ${`New comment on ticket: ${tickets[0]?.title || "Unknown"}`})
      `
    }

    revalidatePath(`/tickets/${ticketId}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Add comment error:", error)
    return { error: "Failed to add comment" }
  }
}

export async function markNotificationRead(notificationId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    await sql`
      UPDATE notifications
      SET read = true
      WHERE id = ${notificationId} AND user_id = ${user.id}
    `

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Mark notification read error:", error)
    return { error: "Failed to mark notification as read" }
  }
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    await sql`
      UPDATE notifications
      SET read = true
      WHERE user_id = ${user.id} AND read = false
    `

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Mark all notifications read error:", error)
    return { error: "Failed to mark notifications as read" }
  }
}
