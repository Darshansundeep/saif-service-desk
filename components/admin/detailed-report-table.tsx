"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, Search, Filter } from "lucide-react"

interface DetailedTicket {
  id: string
  title: string
  description: string
  priority: string
  status: string
  issue_type: string | null
  users_affected: number | null
  requestor_email: string | null
  requestor_phone: string | null
  created_at: string
  updated_at: string
  created_by_name: string
  created_by_email: string
  created_by_role: string
  ticket_creator: string | null
  assigned_to_name: string | null
  assigned_to_email: string | null
  reassignment_count: number
  closed_date: string | null
  resolution_hours: number | null
}

interface DetailedReportTableProps {
  tickets: DetailedTicket[]
}

const statusColors = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  open: "bg-green-500/10 text-green-500 border-green-500/20",
  in_progress: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  resolved: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

const priorityColors = {
  low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
}

export function DetailedReportTable({ tickets }: DetailedReportTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>("all")

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        searchTerm === "" ||
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.requestor_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.created_by_name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter
      const matchesIssueType =
        issueTypeFilter === "all" || ticket.issue_type === issueTypeFilter

      return matchesSearch && matchesStatus && matchesPriority && matchesIssueType
    })
  }, [tickets, searchTerm, statusFilter, priorityFilter, issueTypeFilter])

  // Export to CSV
  function exportToCSV() {
    const headers = [
      "Ticket Ref",
      "Title",
      "Ticket Creator",
      "Raised By",
      "Raised By Email",
      "Requestor Email",
      "Requestor Phone",
      "Priority",
      "Status",
      "Issue Type",
      "Users Affected",
      "Assigned To",
      "Assigned To Email",
      "Created Date",
      "Closed Date",
      "Resolution Time (hours)",
      "Reassignments",
    ]

    const rows = filteredTickets.map((ticket) => [
      ticket.id,
      `"${ticket.title.replace(/"/g, '""')}"`,
      ticket.ticket_creator || ticket.created_by_name,
      ticket.created_by_name,
      ticket.created_by_email,
      ticket.requestor_email || "",
      ticket.requestor_phone || "",
      ticket.priority,
      ticket.status,
      ticket.issue_type || "",
      ticket.users_affected || "",
      ticket.assigned_to_name || "Unassigned",
      ticket.assigned_to_email || "",
      new Date(ticket.created_at).toLocaleString(),
      ticket.closed_date ? new Date(ticket.closed_date).toLocaleString() : "",
      ticket.resolution_hours ? ticket.resolution_hours.toFixed(2) : "",
      ticket.reassignment_count,
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `detailed-ticket-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Export to Excel-friendly format
  function exportToExcel() {
    const headers = [
      "Ticket Ref",
      "Title",
      "Ticket Creator",
      "Raised By",
      "Raised By Email",
      "Requestor Email",
      "Requestor Phone",
      "Priority",
      "Status",
      "Issue Type",
      "Users Affected",
      "Assigned To",
      "Assigned To Email",
      "Created Date",
      "Closed Date",
      "Resolution Time (hours)",
      "Reassignments",
    ]

    const rows = filteredTickets.map((ticket) => [
      ticket.id,
      ticket.title,
      ticket.ticket_creator || ticket.created_by_name,
      ticket.created_by_name,
      ticket.created_by_email,
      ticket.requestor_email || "",
      ticket.requestor_phone || "",
      ticket.priority,
      ticket.status,
      ticket.issue_type || "",
      ticket.users_affected || "",
      ticket.assigned_to_name || "Unassigned",
      ticket.assigned_to_email || "",
      new Date(ticket.created_at).toLocaleString(),
      ticket.closed_date ? new Date(ticket.closed_date).toLocaleString() : "",
      ticket.resolution_hours ? ticket.resolution_hours.toFixed(2) : "",
      ticket.reassignment_count,
    ])

    // Create HTML table for Excel
    const htmlTable = `
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    `

    const blob = new Blob([htmlTable], { type: "application/vnd.ms-excel" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `detailed-ticket-report-${new Date().toISOString().split("T")[0]}.xls`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Export</CardTitle>
          <CardDescription>
            Filter tickets and export to CSV or Excel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ticket ref, title, requestor, or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Issue Type</label>
              <Select value={issueTypeFilter} onValueChange={setIssueTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="change_request">Change Request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
            <Button onClick={exportToExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
          <CardDescription>Complete line-item report</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Ticket Ref</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Title</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Ticket Creator</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Raised By</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Requestor Email</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Requestor Phone</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Priority</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Status</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Issue Type</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Users Affected</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Assigned To</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Created Date</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Closed Date</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Resolution Time</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Reassignments</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-mono text-xs">{ticket.id.substring(0, 8)}</td>
                    <td className="p-3 max-w-xs truncate">{ticket.title}</td>
                    <td className="p-3 whitespace-nowrap">
                      {ticket.ticket_creator ? (
                        <div className="text-sm">{ticket.ticket_creator}</div>
                      ) : (
                        <div>
                          <div>{ticket.created_by_name}</div>
                          <div className="text-xs text-muted-foreground">{ticket.created_by_email}</div>
                        </div>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div>{ticket.created_by_name}</div>
                      <div className="text-xs text-muted-foreground">{ticket.created_by_email}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">{ticket.requestor_email || "-"}</td>
                    <td className="p-3 whitespace-nowrap">{ticket.requestor_phone || "-"}</td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={priorityColors[ticket.priority as keyof typeof priorityColors]}
                      >
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={statusColors[ticket.status as keyof typeof statusColors]}
                      >
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-3 whitespace-nowrap capitalize">
                      {ticket.issue_type?.replace("_", " ") || "-"}
                    </td>
                    <td className="p-3 text-center">{ticket.users_affected || "-"}</td>
                    <td className="p-3 whitespace-nowrap">
                      {ticket.assigned_to_name ? (
                        <div>
                          <div>{ticket.assigned_to_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {ticket.assigned_to_email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {new Date(ticket.created_at).toLocaleDateString()}
                      <div className="text-xs text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {ticket.closed_date ? (
                        <>
                          {new Date(ticket.closed_date).toLocaleDateString()}
                          <div className="text-xs text-muted-foreground">
                            {new Date(ticket.closed_date).toLocaleTimeString()}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {ticket.resolution_hours ? (
                        <span>{ticket.resolution_hours.toFixed(1)}h</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">{ticket.reassignment_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
