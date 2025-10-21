import { sql } from "./db"

export interface SLAPolicy {
  id: string
  name: string
  description: string
  priority: string
  response_time_minutes: number
  resolution_time_minutes: number
  escalation_time_minutes: number | null
  business_hours_only: boolean
  is_active: boolean
}

export interface SLATracking {
  id: string
  ticket_id: string
  sla_policy_id: string
  response_due_at: Date
  first_response_at: Date | null
  response_sla_met: boolean | null
  response_time_minutes: number | null
  resolution_due_at: Date
  resolved_at: Date | null
  resolution_sla_met: boolean | null
  resolution_time_minutes: number | null
  escalation_due_at: Date | null
  escalated_at: Date | null
}

export interface SLAStatus {
  responseStatus: 'met' | 'breached' | 'pending' | 'at_risk'
  resolutionStatus: 'met' | 'breached' | 'pending' | 'at_risk'
  responseTimeRemaining: number | null // minutes
  resolutionTimeRemaining: number | null // minutes
  responseProgress: number // 0-100
  resolutionProgress: number // 0-100
}

/**
 * Get all active SLA policies
 */
export async function getSLAPolicies() {
  try {
    const policies = await sql`
      SELECT * FROM sla_policies
      WHERE is_active = TRUE
      ORDER BY 
        CASE priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `
    return policies as SLAPolicy[]
  } catch (error) {
    console.error('[SLA] Failed to get policies:', error)
    return []
  }
}

/**
 * Get SLA tracking for a specific ticket
 */
export async function getTicketSLA(ticketId: string) {
  try {
    const tracking = await sql`
      SELECT 
        st.*,
        sp.name as policy_name,
        sp.priority as policy_priority,
        sp.response_time_minutes as policy_response_time,
        sp.resolution_time_minutes as policy_resolution_time
      FROM ticket_sla_tracking st
      LEFT JOIN sla_policies sp ON st.sla_policy_id = sp.id
      WHERE st.ticket_id = ${ticketId}
    `
    
    if (tracking.length === 0) return null
    return tracking[0]
  } catch (error) {
    console.error('[SLA] Failed to get ticket SLA:', error)
    return null
  }
}

/**
 * Calculate SLA status for a ticket
 */
export function calculateSLAStatus(tracking: any): SLAStatus {
  const now = new Date()
  
  // Response SLA Status
  let responseStatus: 'met' | 'breached' | 'pending' | 'at_risk' = 'pending'
  let responseTimeRemaining: number | null = null
  let responseProgress = 0
  
  if (tracking.first_response_at) {
    // Response already given
    responseStatus = tracking.response_sla_met ? 'met' : 'breached'
    responseProgress = 100
  } else if (tracking.response_due_at) {
    // Response pending
    const dueAt = new Date(tracking.response_due_at)
    const createdAt = new Date(tracking.created_at)
    const totalTime = dueAt.getTime() - createdAt.getTime()
    const elapsed = now.getTime() - createdAt.getTime()
    
    responseTimeRemaining = Math.floor((dueAt.getTime() - now.getTime()) / 60000)
    responseProgress = Math.min(100, Math.floor((elapsed / totalTime) * 100))
    
    if (now > dueAt) {
      responseStatus = 'breached'
    } else if (responseProgress >= 80) {
      responseStatus = 'at_risk'
    } else {
      responseStatus = 'pending'
    }
  }
  
  // Resolution SLA Status
  let resolutionStatus: 'met' | 'breached' | 'pending' | 'at_risk' = 'pending'
  let resolutionTimeRemaining: number | null = null
  let resolutionProgress = 0
  
  if (tracking.resolved_at) {
    // Ticket resolved
    resolutionStatus = tracking.resolution_sla_met ? 'met' : 'breached'
    resolutionProgress = 100
  } else if (tracking.resolution_due_at) {
    // Resolution pending
    const dueAt = new Date(tracking.resolution_due_at)
    const createdAt = new Date(tracking.created_at)
    const totalTime = dueAt.getTime() - createdAt.getTime()
    const elapsed = now.getTime() - createdAt.getTime()
    
    resolutionTimeRemaining = Math.floor((dueAt.getTime() - now.getTime()) / 60000)
    resolutionProgress = Math.min(100, Math.floor((elapsed / totalTime) * 100))
    
    if (now > dueAt) {
      resolutionStatus = 'breached'
    } else if (resolutionProgress >= 80) {
      resolutionStatus = 'at_risk'
    } else {
      resolutionStatus = 'pending'
    }
  }
  
  return {
    responseStatus,
    resolutionStatus,
    responseTimeRemaining,
    resolutionTimeRemaining,
    responseProgress,
    resolutionProgress
  }
}

/**
 * Get tickets with breached SLAs
 */
export async function getBreachedTickets() {
  try {
    const tickets = await sql`
      SELECT 
        t.id,
        t.title,
        t.priority,
        t.status,
        t.created_at,
        st.response_due_at,
        st.resolution_due_at,
        st.first_response_at,
        st.resolved_at,
        u.full_name as assigned_to_name
      FROM tickets t
      INNER JOIN ticket_sla_tracking st ON t.id = st.ticket_id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE 
        (st.first_response_at IS NULL AND NOW() > st.response_due_at)
        OR (st.resolved_at IS NULL AND NOW() > st.resolution_due_at)
      ORDER BY t.created_at DESC
    `
    return tickets
  } catch (error) {
    console.error('[SLA] Failed to get breached tickets:', error)
    return []
  }
}

/**
 * Get tickets at risk of SLA breach (>80% time elapsed)
 */
export async function getAtRiskTickets() {
  try {
    const tickets = await sql`
      SELECT 
        t.id,
        t.title,
        t.priority,
        t.status,
        t.created_at,
        st.response_due_at,
        st.resolution_due_at,
        st.first_response_at,
        st.resolved_at,
        u.full_name as assigned_to_name,
        EXTRACT(EPOCH FROM (st.response_due_at - NOW())) / 60 as response_minutes_remaining,
        EXTRACT(EPOCH FROM (st.resolution_due_at - NOW())) / 60 as resolution_minutes_remaining
      FROM tickets t
      INNER JOIN ticket_sla_tracking st ON t.id = st.ticket_id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE 
        t.status NOT IN ('resolved', 'closed')
        AND (
          (st.first_response_at IS NULL 
           AND NOW() < st.response_due_at 
           AND EXTRACT(EPOCH FROM (NOW() - t.created_at)) / EXTRACT(EPOCH FROM (st.response_due_at - t.created_at)) > 0.8)
          OR
          (st.resolved_at IS NULL 
           AND NOW() < st.resolution_due_at 
           AND EXTRACT(EPOCH FROM (NOW() - t.created_at)) / EXTRACT(EPOCH FROM (st.resolution_due_at - t.created_at)) > 0.8)
        )
      ORDER BY 
        CASE 
          WHEN st.first_response_at IS NULL THEN st.response_due_at
          ELSE st.resolution_due_at
        END ASC
    `
    return tickets
  } catch (error) {
    console.error('[SLA] Failed to get at-risk tickets:', error)
    return []
  }
}

/**
 * Get SLA compliance metrics
 */
export async function getSLAMetrics(startDate?: Date, endDate?: Date) {
  try {
    const dateFilter = startDate && endDate
      ? sql`AND t.created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}`
      : sql``
    
    const metrics = await sql`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN st.response_sla_met = TRUE THEN 1 END) as response_met,
        COUNT(CASE WHEN st.response_sla_met = FALSE THEN 1 END) as response_breached,
        COUNT(CASE WHEN st.resolution_sla_met = TRUE THEN 1 END) as resolution_met,
        COUNT(CASE WHEN st.resolution_sla_met = FALSE THEN 1 END) as resolution_breached,
        AVG(st.response_time_minutes) as avg_response_time,
        AVG(st.resolution_time_minutes) as avg_resolution_time,
        COUNT(CASE WHEN st.first_response_at IS NULL AND NOW() > st.response_due_at THEN 1 END) as active_response_breaches,
        COUNT(CASE WHEN st.resolved_at IS NULL AND NOW() > st.resolution_due_at THEN 1 END) as active_resolution_breaches
      FROM tickets t
      INNER JOIN ticket_sla_tracking st ON t.id = st.ticket_id
      WHERE 1=1 ${dateFilter}
    `
    
    if (metrics.length === 0) {
      return {
        total_tickets: 0,
        response_met: 0,
        response_breached: 0,
        resolution_met: 0,
        resolution_breached: 0,
        avg_response_time: 0,
        avg_resolution_time: 0,
        active_response_breaches: 0,
        active_resolution_breaches: 0,
        response_compliance_rate: 0,
        resolution_compliance_rate: 0
      }
    }
    
    const result = metrics[0]
    const responseTotal = parseInt(result.response_met) + parseInt(result.response_breached)
    const resolutionTotal = parseInt(result.resolution_met) + parseInt(result.resolution_breached)
    
    return {
      ...result,
      response_compliance_rate: responseTotal > 0 
        ? (parseInt(result.response_met) / responseTotal) * 100 
        : 0,
      resolution_compliance_rate: resolutionTotal > 0 
        ? (parseInt(result.resolution_met) / resolutionTotal) * 100 
        : 0
    }
  } catch (error) {
    console.error('[SLA] Failed to get metrics:', error)
    return null
  }
}

/**
 * Format time remaining in human-readable format
 */
export function formatTimeRemaining(minutes: number | null): string {
  if (minutes === null) return 'N/A'
  
  if (minutes < 0) {
    const absMinutes = Math.abs(minutes)
    if (absMinutes < 60) {
      return `${Math.floor(absMinutes)}m overdue`
    } else if (absMinutes < 1440) {
      const hours = Math.floor(absMinutes / 60)
      const mins = Math.floor(absMinutes % 60)
      return `${hours}h ${mins}m overdue`
    } else {
      const days = Math.floor(absMinutes / 1440)
      const hours = Math.floor((absMinutes % 1440) / 60)
      return `${days}d ${hours}h overdue`
    }
  }
  
  if (minutes < 60) {
    return `${Math.floor(minutes)}m`
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    return `${hours}h ${mins}m`
  } else {
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    return `${days}d ${hours}h`
  }
}

/**
 * Get SLA policy by priority
 */
export async function getSLAPolicyByPriority(priority: string) {
  try {
    const policy = await sql`
      SELECT * FROM sla_policies
      WHERE priority = ${priority}
        AND is_active = TRUE
      LIMIT 1
    `
    return policy.length > 0 ? policy[0] : null
  } catch (error) {
    console.error('[SLA] Failed to get policy by priority:', error)
    return null
  }
}
