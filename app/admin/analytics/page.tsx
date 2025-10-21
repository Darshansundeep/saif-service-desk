import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, Clock, Users, Target } from "lucide-react"
import Link from "next/link"

export default async function AnalyticsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "admin") {
    redirect("/tickets")
  }

  // Tickets created in last 7 days
  const last7Days = await sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM tickets
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `

  // Tickets created in last 30 days
  const last30Days = await sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM tickets
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `

  // Average resolution time (resolved tickets only)
  const resolutionTime = await sql`
    SELECT 
      AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_hours
    FROM tickets
    WHERE status = 'resolved'
  `

  // Tickets by hour of day
  const hourlyDistribution = await sql`
    SELECT 
      EXTRACT(HOUR FROM created_at) as hour,
      COUNT(*) as count
    FROM tickets
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY hour
  `

  // Top requestors by email
  const topRequestors = await sql`
    SELECT 
      requestor_email,
      COUNT(*) as ticket_count
    FROM tickets
    WHERE requestor_email IS NOT NULL
    GROUP BY requestor_email
    ORDER BY ticket_count DESC
    LIMIT 10
  `

  // Tickets by status over time
  const statusTrend = await sql`
    SELECT 
      DATE(created_at) as date,
      status,
      COUNT(*) as count
    FROM tickets
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at), status
    ORDER BY date DESC
  `

  const avgResolutionHours = resolutionTime[0]?.avg_hours 
    ? Math.round(parseFloat(resolutionTime[0].avg_hours) * 10) / 10 
    : 0

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Trends and insights from your ticket data</p>
        </div>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Last 7 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div className="text-3xl font-bold">
                    {last7Days.reduce((sum, day) => sum + parseInt(day.count), 0)}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Tickets created</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Last 30 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <div className="text-3xl font-bold">
                    {last30Days.reduce((sum, day) => sum + parseInt(day.count), 0)}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Tickets created</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Resolution Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <div className="text-3xl font-bold">{avgResolutionHours}h</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Time to resolve</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Requestors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <div className="text-3xl font-bold">{topRequestors.length}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Unique users</p>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Trend - Last 7 Days */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Creation Trend (Last 7 Days)</CardTitle>
              <CardDescription>Daily ticket volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {last7Days.length > 0 ? (
                  last7Days.map((day: any) => {
                    const maxCount = Math.max(...last7Days.map((d: any) => parseInt(d.count)))
                    const percentage = (parseInt(day.count) / maxCount) * 100
                    
                    return (
                      <div key={day.date} className="flex items-center gap-4">
                        <div className="w-32 text-sm text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-muted rounded-full h-8 relative">
                            <div
                              className="h-8 rounded-full bg-blue-500 flex items-center justify-end pr-3"
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="text-sm font-medium text-white">
                                {day.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No tickets in the last 7 days</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Requestors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Requestors</CardTitle>
              <CardDescription>Users with most tickets submitted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topRequestors.length > 0 ? (
                  topRequestors.map((requestor: any, index: number) => (
                    <div key={requestor.requestor_email} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm">{requestor.requestor_email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-purple-500"
                            style={{
                              width: `${(parseInt(requestor.ticket_count) / parseInt(topRequestors[0].ticket_count)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {requestor.ticket_count}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No requestor data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hourly Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Creation by Hour</CardTitle>
              <CardDescription>When tickets are typically created</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-2">
                {Array.from({ length: 24 }, (_, i) => {
                  const hourData = hourlyDistribution.find((h: any) => parseInt(h.hour) === i)
                  const count = hourData ? parseInt(hourData.count) : 0
                  const maxCount = Math.max(...hourlyDistribution.map((h: any) => parseInt(h.count)), 1)
                  const height = (count / maxCount) * 100
                  
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="h-32 w-full bg-muted rounded relative flex items-end">
                        <div
                          className="w-full bg-blue-500 rounded"
                          style={{ height: `${height}%` }}
                          title={`${i}:00 - ${count} tickets`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{i}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Hour of Day (0-23)
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
