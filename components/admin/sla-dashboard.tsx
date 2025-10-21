"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Target,
  Timer
} from "lucide-react"
import Link from "next/link"
import { SLABadge } from "@/components/sla-indicator"

interface SLADashboardProps {
  policies: any[]
  metrics: any
  breachedTickets: any[]
  atRiskTickets: any[]
}

export function SLADashboard({ policies, metrics, breachedTickets, atRiskTickets }: SLADashboardProps) {
  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${Math.floor(minutes)}m`
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      return `${hours}h`
    }
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    return `${days}d ${hours}h`
  }

  return (
    <div className="space-y-6">
      {/* SLA Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Response Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {metrics?.response_compliance_rate?.toFixed(1) || 0}%
            </div>
            <Progress 
              value={metrics?.response_compliance_rate || 0} 
              className="h-2 mt-2"
              indicatorClassName="bg-green-500"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics?.response_met || 0} met / {metrics?.response_breached || 0} breached
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Resolution Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {metrics?.resolution_compliance_rate?.toFixed(1) || 0}%
            </div>
            <Progress 
              value={metrics?.resolution_compliance_rate || 0} 
              className="h-2 mt-2"
              indicatorClassName="bg-blue-500"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics?.resolution_met || 0} met / {metrics?.resolution_breached || 0} breached
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Active Breaches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {(metrics?.active_response_breaches || 0) + (metrics?.active_resolution_breaches || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics?.active_response_breaches || 0} response / {metrics?.active_resolution_breaches || 0} resolution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatMinutes(metrics?.avg_response_time || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Avg resolution: {formatMinutes(metrics?.avg_resolution_time || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SLA Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            SLA Policies
          </CardTitle>
          <CardDescription>Configured SLA policies by priority</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {policies.map((policy) => (
              <div key={policy.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{policy.name}</h4>
                    {policy.description && (
                      <p className="text-sm text-muted-foreground mt-1">{policy.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={
                    policy.priority === 'critical' ? 'border-red-500 text-red-500' :
                    policy.priority === 'high' ? 'border-orange-500 text-orange-500' :
                    policy.priority === 'medium' ? 'border-blue-500 text-blue-500' :
                    'border-gray-500 text-gray-500'
                  }>
                    {policy.priority}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Response Time:</span>
                    <div className="font-medium">{formatMinutes(policy.response_time_minutes)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Resolution Time:</span>
                    <div className="font-medium">{formatMinutes(policy.resolution_time_minutes)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Escalation:</span>
                    <div className="font-medium">
                      {policy.escalation_time_minutes ? formatMinutes(policy.escalation_time_minutes) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Breached Tickets */}
      {breachedTickets.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="h-5 w-5" />
              SLA Breached Tickets ({breachedTickets.length})
            </CardTitle>
            <CardDescription>Tickets that have breached their SLA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {breachedTickets.slice(0, 10).map((ticket: any) => (
                <Link 
                  key={ticket.id} 
                  href={`/tickets/${ticket.id}`}
                  className="block border rounded-lg p-3 hover:bg-background transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{ticket.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {ticket.priority}
                        </Badge>
                        <span>•</span>
                        <span>{ticket.status}</span>
                        {ticket.assigned_to_name && (
                          <>
                            <span>•</span>
                            <span>{ticket.assigned_to_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <SLABadge status="breached" type="response" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* At Risk Tickets */}
      {atRiskTickets.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              At Risk Tickets ({atRiskTickets.length})
            </CardTitle>
            <CardDescription>Tickets approaching SLA breach (&gt;80% time elapsed)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {atRiskTickets.slice(0, 10).map((ticket: any) => (
                <Link 
                  key={ticket.id} 
                  href={`/tickets/${ticket.id}`}
                  className="block border rounded-lg p-3 hover:bg-background transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{ticket.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {ticket.priority}
                        </Badge>
                        <span>•</span>
                        <span>{ticket.status}</span>
                        {ticket.assigned_to_name && (
                          <>
                            <span>•</span>
                            <span>{ticket.assigned_to_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <SLABadge status="at_risk" type={ticket.first_response_at ? "resolution" : "response"} />
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-mono">
                        {ticket.first_response_at 
                          ? `${Math.floor(ticket.resolution_minutes_remaining)}m left`
                          : `${Math.floor(ticket.response_minutes_remaining)}m left`
                        }
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message if no issues */}
      {breachedTickets.length === 0 && atRiskTickets.length === 0 && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <CheckCircle className="h-6 w-6" />
              <div>
                <h4 className="font-semibold">All SLAs On Track</h4>
                <p className="text-sm text-muted-foreground">No tickets are currently breaching or at risk of breaching SLA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
