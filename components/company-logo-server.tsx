import { sql } from "@/lib/db"
import { CompanyLogo } from "./company-logo"
import { existsSync } from "fs"
import { join } from "path"

interface CompanyLogoServerProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export async function CompanyLogoServer({ size, showText, className }: CompanyLogoServerProps) {
  // Get settings from database
  let companyName = "Your Company"
  let tagline = "Service Desk"
  let logoUrl: string | undefined
  
  let logoTimestamp = Date.now().toString()
  
  try {
    const settings = await sql`
      SELECT setting_key, setting_value 
      FROM system_settings 
      WHERE setting_key IN ('company_name', 'company_tagline', 'company_logo', 'logo_updated_at')
    `
    
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
  } catch (error) {
    console.error('[CompanyLogoServer] Failed to load settings:', error)
  }
  
  // If no logo in database, check if custom logo exists (check for common extensions)
  if (!logoUrl) {
    const publicDir = join(process.cwd(), 'public')
    const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp']
    
    for (const ext of extensions) {
      const logoFile = join(publicDir, `logo.${ext}`)
      if (existsSync(logoFile)) {
        logoUrl = `/logo.${ext}?v=${logoTimestamp}`
        break
      }
    }
  } else {
    // Add cache busting timestamp from database
    logoUrl = `${logoUrl}?v=${logoTimestamp}`
  }

  return (
    <CompanyLogo
      size={size}
      showText={showText}
      className={className}
      companyName={companyName}
      tagline={tagline}
      logoUrl={logoUrl}
    />
  )
}
