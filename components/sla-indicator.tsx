"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SLAIndicatorProps {
  status: 'met' | 'breached' | 'pending' | 'at_risk'
  timeRemaining: number | null // minutes
  progress: number // 0-100
  type: 'response' | 'resolution'
  compact?: boolean
}

export function SLAIndicator({ status, timeRemaining, progress, type, compact = false }: SLAIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'met':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'breached':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'at_risk':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      case 'pending':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getProgressColor = () => {
    if (status === 'breached') return 'bg-red-500'
    if (status === 'at_risk') return 'bg-orange-500'
    if (status === 'met') return 'bg-green-500'
    return 'bg-blue-500'
  }

  const getIcon = () => {
    switch (status) {
      case 'met':
        return <CheckCircle className="h-3 w-3" />
      case 'breached':
        return <XCircle className="h-3 w-3" />
      case 'at_risk':
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const formatTime = (minutes: number | null): string => {
    if (minutes === null) return 'N/A'
    
    const absMinutes = Math.abs(minutes)
    const isOverdue = minutes < 0
    
    let timeStr = ''
    if (absMinutes < 60) {
      timeStr = `${Math.floor(absMinutes)}m`
    } else if (absMinutes < 1440) {
      const hours = Math.floor(absMinutes / 60)
      const mins = Math.floor(absMinutes % 60)
      timeStr = `${hours}h ${mins}m`
    } else {
      const days = Math.floor(absMinutes / 1440)
      const hours = Math.floor((absMinutes % 1440) / 60)
      timeStr = `${days}d ${hours}h`
    }
    
    return isOverdue ? `${timeStr} overdue` : timeStr
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'met':
        return 'Met'
      case 'breached':
        return 'Breached'
      case 'at_risk':
        return 'At Risk'
      case 'pending':
        return 'Pending'
      default:
        return 'Unknown'
    }
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`${getStatusColor()} flex items-center gap-1 text-xs`}>
              {getIcon()}
              <span className="capitalize">{type}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <div className="font-semibold">{type === 'response' ? 'Response SLA' : 'Resolution SLA'}</div>
              <div>Status: {getStatusLabel()}</div>
              {timeRemaining !== null && (
                <div>Time: {formatTime(timeRemaining)}</div>
              )}
              <div>Progress: {progress}%</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${getStatusColor()} flex items-center gap-1`}>
            {getIcon()}
            <span className="capitalize">{type} SLA</span>
          </Badge>
          <span className="text-sm font-medium">{getStatusLabel()}</span>
        </div>
        {timeRemaining !== null && (
          <span className={`text-sm font-mono ${status === 'breached' ? 'text-red-500' : status === 'at_risk' ? 'text-orange-500' : 'text-muted-foreground'}`}>
            {formatTime(timeRemaining)}
          </span>
        )}
      </div>
      <Progress value={progress} className="h-2" indicatorClassName={getProgressColor()} />
    </div>
  )
}

interface SLABadgeProps {
  status: 'met' | 'breached' | 'pending' | 'at_risk'
  type: 'response' | 'resolution'
}

export function SLABadge({ status, type }: SLABadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'met':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'breached':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'at_risk':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      case 'pending':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getIcon = () => {
    switch (status) {
      case 'met':
        return <CheckCircle className="h-3 w-3" />
      case 'breached':
        return <XCircle className="h-3 w-3" />
      case 'at_risk':
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  return (
    <Badge variant="outline" className={`${getStatusColor()} flex items-center gap-1 text-xs`}>
      {getIcon()}
      <span className="capitalize">{type}</span>
    </Badge>
  )
}
