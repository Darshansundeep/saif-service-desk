import { sql } from "./db"

export type AuditAction = 
  | "CREATE" 
  | "UPDATE" 
  | "DELETE" 
  | "LOGIN" 
  | "LOGOUT"
  | "ASSIGN"
  | "REASSIGN"
  | "STATUS_CHANGE"
  | "PRIORITY_CHANGE"
  | "COMMENT_ADD"
  | "ATTACHMENT_UPLOAD"
  | "ATTACHMENT_DELETE"
  | "ROLE_CHANGE"
  | "SETTINGS_UPDATE"
  | "PASSWORD_CHANGE"

export type EntityType = 
  | "ticket"
  | "user"
  | "comment"
  | "attachment"
  | "notification"
  | "settings"
  | "auth"

interface AuditLogEntry {
  userId?: string
  userEmail?: string
  userName?: string
  action: AuditAction
  entityType: EntityType
  entityId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  description?: string
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_logs (
        user_id,
        user_email,
        user_name,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        description
      ) VALUES (
        ${entry.userId || null},
        ${entry.userEmail || null},
        ${entry.userName || null},
        ${entry.action},
        ${entry.entityType},
        ${entry.entityId || null},
        ${entry.oldValues ? JSON.stringify(entry.oldValues) : null},
        ${entry.newValues ? JSON.stringify(entry.newValues) : null},
        ${entry.ipAddress || null},
        ${entry.userAgent || null},
        ${entry.description || null}
      )
    `
    console.log(`[Audit] ${entry.action} ${entry.entityType} by ${entry.userEmail || 'system'}`)
  } catch (error) {
    console.error('[Audit] Failed to create audit log:', error)
    // Don't throw - audit logging should not break main functionality
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters?: {
  userId?: string
  entityType?: EntityType
  entityId?: string
  action?: AuditAction
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  try {
    const limit = filters?.limit || 200
    const offset = filters?.offset || 0

    // Get all recent logs (we'll filter in JS)
    const result = await sql`
      SELECT 
        al.*,
        u.full_name as current_user_name,
        u.email as current_user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 500
    `

    // Apply filters in JavaScript if needed
    let filtered = result

    if (filters?.userId) {
      filtered = filtered.filter((log: any) => log.user_id === filters.userId)
    }

    if (filters?.entityType) {
      filtered = filtered.filter((log: any) => log.entity_type === filters.entityType)
    }

    if (filters?.entityId) {
      filtered = filtered.filter((log: any) => log.entity_id === filters.entityId)
    }

    if (filters?.action) {
      filtered = filtered.filter((log: any) => log.action === filters.action)
    }

    if (filters?.startDate) {
      filtered = filtered.filter((log: any) => new Date(log.created_at) >= filters.startDate!)
    }

    if (filters?.endDate) {
      filtered = filtered.filter((log: any) => new Date(log.created_at) <= filters.endDate!)
    }

    return filtered
  } catch (error) {
    console.error('[Audit] Failed to get audit logs:', error)
    return []
  }
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditHistory(
  entityType: EntityType,
  entityId: string,
  limit: number = 50
) {
  return getAuditLogs({
    entityType,
    entityId,
    limit
  })
}

/**
 * Get user activity logs
 */
export async function getUserActivityLogs(
  userId: string,
  limit: number = 100
) {
  return getAuditLogs({
    userId,
    limit
  })
}

/**
 * Get recent system activity
 */
export async function getRecentActivity(limit: number = 50) {
  return getAuditLogs({ limit })
}

/**
 * Helper to log ticket changes
 */
export async function logTicketChange(
  action: AuditAction,
  ticketId: string,
  user: { id: string; email: string; full_name: string },
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  description?: string
) {
  await createAuditLog({
    userId: user.id,
    userEmail: user.email,
    userName: user.full_name,
    action,
    entityType: "ticket",
    entityId: ticketId,
    oldValues,
    newValues,
    description
  })
}

/**
 * Helper to log user changes
 */
export async function logUserChange(
  action: AuditAction,
  targetUserId: string,
  performedBy: { id: string; email: string; full_name: string },
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  description?: string
) {
  await createAuditLog({
    userId: performedBy.id,
    userEmail: performedBy.email,
    userName: performedBy.full_name,
    action,
    entityType: "user",
    entityId: targetUserId,
    oldValues,
    newValues,
    description
  })
}

/**
 * Helper to log authentication events
 */
export async function logAuthEvent(
  action: "LOGIN" | "LOGOUT",
  user: { id: string; email: string; full_name: string },
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    userId: user.id,
    userEmail: user.email,
    userName: user.full_name,
    action,
    entityType: "auth",
    ipAddress,
    userAgent,
    description: action === "LOGIN" ? "User logged in" : "User logged out"
  })
}
