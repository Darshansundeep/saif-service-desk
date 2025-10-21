"use server"

import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createSLAPolicy(formData: FormData) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const priority = formData.get("priority") as string
  const responseTimeMinutes = parseInt(formData.get("response_time_minutes") as string)
  const resolutionTimeMinutes = parseInt(formData.get("resolution_time_minutes") as string)
  const escalationTimeMinutes = formData.get("escalation_time_minutes") as string
  const businessHoursOnly = formData.get("business_hours_only") === "true"

  if (!name || !priority || !responseTimeMinutes || !resolutionTimeMinutes) {
    return { error: "All required fields must be filled" }
  }

  try {
    await sql`
      INSERT INTO sla_policies (
        name, 
        description, 
        priority, 
        response_time_minutes, 
        resolution_time_minutes, 
        escalation_time_minutes,
        business_hours_only,
        created_by
      )
      VALUES (
        ${name},
        ${description},
        ${priority},
        ${responseTimeMinutes},
        ${resolutionTimeMinutes},
        ${escalationTimeMinutes ? parseInt(escalationTimeMinutes) : null},
        ${businessHoursOnly},
        ${currentUser.id}
      )
    `

    revalidatePath("/admin/sla")
    return { success: true, message: "SLA policy created successfully" }
  } catch (error) {
    console.error("[SLA] Create policy error:", error)
    return { error: "Failed to create SLA policy" }
  }
}

export async function updateSLAPolicy(formData: FormData) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized" }
  }

  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const priority = formData.get("priority") as string
  const responseTimeMinutes = parseInt(formData.get("response_time_minutes") as string)
  const resolutionTimeMinutes = parseInt(formData.get("resolution_time_minutes") as string)
  const escalationTimeMinutes = formData.get("escalation_time_minutes") as string
  const businessHoursOnly = formData.get("business_hours_only") === "true"
  const isActive = formData.get("is_active") === "true"

  if (!id || !name || !priority || !responseTimeMinutes || !resolutionTimeMinutes) {
    return { error: "All required fields must be filled" }
  }

  try {
    await sql`
      UPDATE sla_policies
      SET 
        name = ${name},
        description = ${description},
        priority = ${priority},
        response_time_minutes = ${responseTimeMinutes},
        resolution_time_minutes = ${resolutionTimeMinutes},
        escalation_time_minutes = ${escalationTimeMinutes ? parseInt(escalationTimeMinutes) : null},
        business_hours_only = ${businessHoursOnly},
        is_active = ${isActive},
        updated_at = NOW()
      WHERE id = ${id}
    `

    revalidatePath("/admin/sla")
    return { success: true, message: "SLA policy updated successfully" }
  } catch (error) {
    console.error("[SLA] Update policy error:", error)
    return { error: "Failed to update SLA policy" }
  }
}

export async function deleteSLAPolicy(policyId: string) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized" }
  }

  try {
    // Check if policy is in use
    const inUse = await sql`
      SELECT COUNT(*) as count
      FROM ticket_sla_tracking
      WHERE sla_policy_id = ${policyId}
    `

    if (parseInt(inUse[0].count) > 0) {
      return { error: "Cannot delete policy that is in use by tickets. Deactivate it instead." }
    }

    await sql`
      DELETE FROM sla_policies
      WHERE id = ${policyId}
    `

    revalidatePath("/admin/sla")
    return { success: true, message: "SLA policy deleted successfully" }
  } catch (error) {
    console.error("[SLA] Delete policy error:", error)
    return { error: "Failed to delete SLA policy" }
  }
}

export async function toggleSLAPolicyStatus(policyId: string, isActive: boolean) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized" }
  }

  try {
    await sql`
      UPDATE sla_policies
      SET is_active = ${isActive},
          updated_at = NOW()
      WHERE id = ${policyId}
    `

    revalidatePath("/admin/sla")
    return { success: true, message: `SLA policy ${isActive ? 'activated' : 'deactivated'} successfully` }
  } catch (error) {
    console.error("[SLA] Toggle policy status error:", error)
    return { error: "Failed to update policy status" }
  }
}

export async function updateBusinessHours(formData: FormData) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized" }
  }

  try {
    // Update each day
    for (let day = 0; day <= 6; day++) {
      const isWorkingDay = formData.get(`day_${day}_working`) === "true"
      const startTime = formData.get(`day_${day}_start`) as string
      const endTime = formData.get(`day_${day}_end`) as string

      await sql`
        UPDATE business_hours
        SET 
          is_working_day = ${isWorkingDay},
          start_time = ${startTime || '09:00:00'},
          end_time = ${endTime || '17:00:00'}
        WHERE day_of_week = ${day}
      `
    }

    revalidatePath("/admin/sla")
    return { success: true, message: "Business hours updated successfully" }
  } catch (error) {
    console.error("[SLA] Update business hours error:", error)
    return { error: "Failed to update business hours" }
  }
}

export async function addHoliday(formData: FormData) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const date = formData.get("date") as string
  const isRecurring = formData.get("is_recurring") === "true"

  if (!name || !date) {
    return { error: "Name and date are required" }
  }

  try {
    await sql`
      INSERT INTO holidays (name, date, is_recurring)
      VALUES (${name}, ${date}, ${isRecurring})
    `

    revalidatePath("/admin/sla")
    return { success: true, message: "Holiday added successfully" }
  } catch (error) {
    console.error("[SLA] Add holiday error:", error)
    return { error: "Failed to add holiday" }
  }
}

export async function deleteHoliday(holidayId: string) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized" }
  }

  try {
    await sql`
      DELETE FROM holidays
      WHERE id = ${holidayId}
    `

    revalidatePath("/admin/sla")
    return { success: true, message: "Holiday deleted successfully" }
  } catch (error) {
    console.error("[SLA] Delete holiday error:", error)
    return { error: "Failed to delete holiday" }
  }
}
