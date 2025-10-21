"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Ticket, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Users,
  TrendingUp,
  Download
} from "lucide-react"

interface ReportsDashboardProps {
  ticketStats: any
  priorityStats: any[]
  issueTypeStats: any[]
  agentStats: any[]
  recentTickets: any[]
  ticketTrend: any[]
  impactStats: any
}

const statusColors = {
  new: "bg-blue-500/10 text-blue-500",
  open: "bg-green-500/10 text-green-500",
  in_progress: "bg-yellow-500/10 text-yellow-500",
  resolved: "bg-purple-500/10 text-purple-500",
  closed: "bg-gray-500/10 text-gray-500",
}

const priorityColors = {
  low: "bg-gray-500/10 text-gray-500",
  medium: "bg-blue-500/10 text-blue-500",
  high: "bg-orange-500/10 text-orange-500",
  critical: "bg-red-500/10 text-red-500",
}

export function ReportsDashboard({
  ticketStats,
  priorityStats,
  issueTypeStats,
  agentStats,
  recentTickets,
  ticketTrend,
  impactStats,
}: ReportsDashboardProps) {
  
  function exportToCSV() {
    // Simple CSV export functionality
    const csvContent = [
      ["Metric", "Value"],
      ["Total Tickets", ticketStats.total_tickets],
      ["New Tickets", ticketStats.new_tickets],
      ["Open Tickets", ticketStats.open_tickets],
      ["In Progress", ticketStats.in_progress_tickets],
      ["Resolved", ticketStats.resolved_tickets],
      ["Closed", ticketStats.closed_tickets],
    ]
      .map(row => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ticket-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <div className="text-3xl font-bold">{ticketStats.total_tickets}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <div className="text-3xl font-bold">{ticketStats.open_tickets}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div className="text-3xl font-bold">{ticketStats.in_progress_tickets}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="text-3xl font-bold">{ticketStats.resolved_tickets}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Statistics */}
      {impactStats && (
        <Card>
          <CardHeader>
            <CardTitle>User Impact Analysis</CardTitle>
            <CardDescription>Statistics on users affected by tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Users Affected</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  {impactStats.total_users_affected || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Average per Ticket</div>
                <div className="text-2xl font-bold">
                  {impactStats.avg_users_affected ? Math.round(impactStats.avg_users_affected) : 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Maximum Impact</div>
                <div className="text-2xl font-bold text-red-500">
                  {impactStats.max_users_affected || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Tickets by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priorityStats.map((stat: any) => (
                <div key={stat.priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={priorityColors[stat.priority as keyof typeof priorityColors]}>
                      {stat.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${priorityColors[stat.priority as keyof typeof priorityColors]}`}
                        style={{
                          width: `${(parseInt(stat.count) / parseInt(ticketStats.total_tickets)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{stat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Issue Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Types</CardTitle>
            <CardDescription>Tickets by issue category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {issueTypeStats.length > 0 ? (
                issueTypeStats.map((stat: any) => (
                  <div key={stat.issue_type} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{stat.issue_type?.replace('_', ' ') || 'Unknown'}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{
                            width: `${(parseInt(stat.count) / parseInt(ticketStats.total_tickets)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{stat.count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No issue type data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
          <CardDescription>Tickets assigned and resolved by agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-2 font-semibold">Agent</th>
                  <th className="text-right p-2 font-semibold">Assigned</th>
                  <th className="text-right p-2 font-semibold">Resolved</th>
                  <th className="text-right p-2 font-semibold">Closed</th>
                  <th className="text-right p-2 font-semibold">Resolution Rate</th>
                </tr>
              </thead>
              <tbody>
                {agentStats.map((agent: any) => {
                  const resolutionRate = agent.assigned_tickets > 0
                    ? Math.round((parseInt(agent.resolved_tickets) / parseInt(agent.assigned_tickets)) * 100)
                    : 0

                  return (
                    <tr key={agent.email} className="border-b">
                      <td className="p-2">{agent.full_name}</td>
                      <td className="p-2 text-right">{agent.assigned_tickets}</td>
                      <td className="p-2 text-right">{agent.resolved_tickets}</td>
                      <td className="p-2 text-right">{agent.closed_tickets}</td>
                      <td className="p-2 text-right">
                        <Badge variant="secondary">{resolutionRate}%</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>Last 10 tickets created</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTickets.map((ticket: any) => (
              <div key={ticket.id} className="flex items-center justify-between border-b pb-2">
                <div className="flex-1">
                  <div className="font-medium">{ticket.title}</div>
                  <div className="text-sm text-muted-foreground">by {ticket.creator_name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusColors[ticket.status as keyof typeof statusColors]}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
