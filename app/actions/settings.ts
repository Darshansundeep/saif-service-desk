"use server"

import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function getSettings() {
  try {
    const settings = await sql`
      SELECT setting_key, setting_value, setting_type, description
      FROM system_settings
      ORDER BY setting_key
    `
    
    // Convert to key-value object
    const settingsObj: Record<string, any> = {}
    settings.forEach((setting: any) => {
      settingsObj[setting.setting_key] = setting.setting_value
    })
    
    return { settings: settingsObj }
  } catch (error) {
    console.error("[Settings] Get settings error:", error)
    return { error: "Failed to load settings" }
  }
}

export async function updateSettings(formData: FormData) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized" }
  }

  try {
    let logoFilename = null
    
    // Handle logo upload if present
    const logoFile = formData.get("logo") as File
    if (logoFile && logoFile.size > 0) {
      const bytes = await logoFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Determine file extension
      const ext = logoFile.name.split('.').pop()
      const timestamp = Date.now()
      const filename = `logo.${ext}`
      
      // Save to public directory
      const publicDir = join(process.cwd(), 'public')
      const filepath = join(publicDir, filename)
      
      await writeFile(filepath, buffer)
      logoFilename = filename
      console.log(`[Settings] Logo uploaded: ${filename}`)
      
      // Store logo filename AND timestamp in settings for cache busting
      const existingLogo = await sql`
        SELECT setting_key FROM system_settings WHERE setting_key IN ('company_logo', 'logo_updated_at')
      `
      
      const hasLogo = existingLogo.some((s: any) => s.setting_key === 'company_logo')
      const hasTimestamp = existingLogo.some((s: any) => s.setting_key === 'logo_updated_at')
      
      if (hasLogo) {
        await sql`
          UPDATE system_settings
          SET setting_value = ${logoFilename}, 
              updated_at = NOW(),
              updated_by = ${currentUser.id}
          WHERE setting_key = 'company_logo'
        `
      } else {
        await sql`
          INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by)
          VALUES ('company_logo', ${logoFilename}, 'string', ${currentUser.id})
        `
      }
      
      // Store timestamp for cache busting
      if (hasTimestamp) {
        await sql`
          UPDATE system_settings
          SET setting_value = ${timestamp.toString()}, 
              updated_at = NOW(),
              updated_by = ${currentUser.id}
          WHERE setting_key = 'logo_updated_at'
        `
      } else {
        await sql`
          INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by)
          VALUES ('logo_updated_at', ${timestamp.toString()}, 'string', ${currentUser.id})
        `
      }
    }

    const updates: Array<{ key: string; value: string }> = []
    
    // Extract all form fields (excluding file)
    for (const [key, value] of formData.entries()) {
      if (key !== "logo" && typeof value === "string") {
        updates.push({ key, value })
      }
    }

    // Update each setting
    for (const { key, value } of updates) {
      // Check if setting exists
      const existing = await sql`
        SELECT setting_key FROM system_settings WHERE setting_key = ${key}
      `
      
      if (existing.length > 0) {
        await sql`
          UPDATE system_settings
          SET setting_value = ${value}, 
              updated_at = NOW(),
              updated_by = ${currentUser.id}
          WHERE setting_key = ${key}
        `
      } else {
        // Insert new setting
        await sql`
          INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by)
          VALUES (${key}, ${value}, 'string', ${currentUser.id})
        `
      }
    }

    // Revalidate all paths to refresh logo and settings everywhere
    revalidatePath("/", "layout")
    revalidatePath("/admin/settings")
    revalidatePath("/login")
    revalidatePath("/tickets")
    
    return { success: true, message: "Settings updated successfully" }
  } catch (error) {
    console.error("[Settings] Update settings error:", error)
    return { error: "Failed to update settings" }
  }
}

export async function testSmtpConnection(formData: FormData) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized" }
  }

  const smtpHost = formData.get("smtp_host") as string
  const smtpPort = formData.get("smtp_port") as string
  const smtpUser = formData.get("smtp_user") as string
  const smtpPassword = formData.get("smtp_password") as string

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    return { error: "All SMTP fields are required for testing" }
  }

  try {
    // Note: Actual SMTP testing would require nodemailer or similar
    // For now, we'll just validate the fields
    const port = parseInt(smtpPort)
    if (isNaN(port) || port < 1 || port > 65535) {
      return { error: "Invalid port number" }
    }

    // In a real implementation, you would:
    // const nodemailer = require('nodemailer')
    // const transporter = nodemailer.createTransport({ host, port, auth: { user, pass } })
    // await transporter.verify()

    return { 
      success: true, 
      message: "SMTP configuration appears valid. Note: Actual email sending requires nodemailer setup." 
    }
  } catch (error) {
    console.error("[Settings] SMTP test error:", error)
    return { error: "SMTP connection test failed" }
  }
}
