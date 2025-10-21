import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { existsSync } from "fs"
import { join } from "path"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get settings from database
    const settings = await sql`
      SELECT setting_key, setting_value 
      FROM system_settings 
      WHERE setting_key IN ('company_name', 'company_tagline', 'company_logo', 'logo_updated_at')
    `
    
    let companyName = "Your Company"
    let tagline = "Service Desk"
    let logoUrl: string | undefined
    let logoTimestamp = Date.now().toString()
    
    settings.forEach((setting: any) => {
      if (setting.setting_key === 'company_name' && setting.setting_value) {
        companyName = setting.setting_value
      }
      if (setting.setting_key === 'company_tagline' && setting.setting_value) {
        tagline = setting.setting_value
      }
      if (setting.setting_key === 'company_logo' && setting.setting_value) {
        logoUrl = `/${setting.setting_value}`
      }
      if (setting.setting_key === 'logo_updated_at' && setting.setting_value) {
        logoTimestamp = setting.setting_value
      }
    })
    
    // If no logo in database, check if custom logo exists
    if (!logoUrl) {
      const publicDir = join(process.cwd(), 'public')
      const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp']
      
      for (const ext of extensions) {
        const logoFile = join(publicDir, `logo.${ext}`)
        if (existsSync(logoFile)) {
          logoUrl = `/logo.${ext}`
          break
        }
      }
    }
    
    // Add cache busting timestamp from database
    if (logoUrl) {
      logoUrl = `${logoUrl}?v=${logoTimestamp}`
    }
    
    return NextResponse.json({
      companyName,
      tagline,
      logoUrl
    })
  } catch (error) {
    console.error('[API] Get settings error:', error)
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    )
  }
}
