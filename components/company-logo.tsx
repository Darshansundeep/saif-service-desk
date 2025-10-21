"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Building2 } from "lucide-react"

interface CompanyLogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
  companyName?: string
  tagline?: string
  logoUrl?: string
  layout?: "horizontal" | "vertical"
}

const sizeMap = {
  sm: { width: 48, height: 48, textSize: "text-sm" },
  md: { width: 64, height: 64, textSize: "text-base" },
  lg: { width: 96, height: 96, textSize: "text-lg" },
}

export function CompanyLogo({ 
  size = "md", 
  showText = true, 
  className = "",
  companyName: initialCompanyName,
  tagline: initialTagline,
  logoUrl: initialLogoUrl,
  layout = "horizontal"
}: CompanyLogoProps) {
  const { width, height, textSize } = sizeMap[size]
  
  const [companyName, setCompanyName] = useState(initialCompanyName || "Your Company")
  const [tagline, setTagline] = useState(initialTagline || "Service Desk")
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)
  
  useEffect(() => {
    // Fetch settings from API
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.companyName) setCompanyName(data.companyName)
        if (data.tagline) setTagline(data.tagline)
        if (data.logoUrl) setLogoUrl(data.logoUrl)
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])
  
  // Check if logo URL is provided and valid
  const hasCustomLogo = logoUrl && logoUrl.trim() !== ''

  const containerClass = layout === "vertical" 
    ? `flex flex-col items-center gap-3 ${className}`
    : `flex items-center gap-3 ${className}`

  return (
    <div className={containerClass}>
      {hasCustomLogo ? (
        <Image
          src={logoUrl!}
          alt={`${companyName} Logo`}
          width={width}
          height={height}
          className="object-contain"
          priority
          unoptimized
        />
      ) : (
        // Placeholder - Replace with your logo
        <div 
          className="flex items-center justify-center bg-primary rounded-lg"
          style={{ width, height }}
        >
          <Building2 className="text-primary-foreground" style={{ width: width * 0.6, height: height * 0.6 }} />
        </div>
      )}
      
      {showText && (
        <div className="flex flex-col justify-center">
          <span className={`font-bold ${textSize} leading-tight text-center`}>
            {companyName}
          </span>
          <span className="text-sm text-muted-foreground text-center mt-1">
            {tagline}
          </span>
        </div>
      )}
    </div>
  )
}
