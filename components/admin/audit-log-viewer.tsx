"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Search, Eye, Download, Filter } from "lucide-react"

interface AuditLog {
  id: number
  user_id: string | null
  user_email: string | null
  user_name: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_values: any
  new_values: any
  ip_address: string | null
  user_agent: string | null
  description: string | null
  created_at: string
  current_user_name: string | null
  current_user_email: string | null
}

interface AuditLogViewerProps {
  initialLogs: AuditLog[]
}

const actionColors: Record<string, string> = {
  CREATE: "bg-green-500/10 text-green-500 border-green-500/20",
  UPDATE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
  LOGIN: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  LOGOUT: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  ASSIGN: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  REASSIGN: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  STATUS_CHANGE: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  PRIORITY_CHANGE: "bg-pink-500/10 text-pink-500 border-pink-500/20",
}

const entityColors: Record<string, string> = {
  ticket: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  user: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  comment: "bg-green-500/10 text-green-500 border-green-500/20",
  attachment: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  settings: "bg-red-500/10 text-red-500 border-red-500/20",
  auth: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

export function AuditLogViewer({ initialLogs }: AuditLogViewerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Filter logs
  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      const matchesSearch =
        searchTerm === "" ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesAction = actionFilter === "all" || log.action === actionFilter
      const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter

      return matchesSearch && matchesAction && matchesEntity
    })
  }, [initialLogs, searchTerm, actionFilter, entityFilter])

  // Get unique actions and entities for filters
  const uniqueActions = Array.from(new Set(initialLogs.map((log) => log.action)))
  const uniqueEntities = Array.from(new Set(initialLogs.map((log) => log.entity_type)))

  // Export to CSV
  function exportToCSV() {
    const headers = [
      "Timestamp",
      "User",
      "Email",
      "Action",
      "Entity Type",
      "Entity ID",
      "Description",
      "IP Address",
    ]

    const rows = filteredLogs.map((log) => [
      new Date(log.created_at).toLocaleString(),
      log.user_name || log.current_user_name || "System",
      log.user_email || log.current_user_email || "-",
      log.action,
      log.entity_type,
      log.entity_id || "-",
      log.description || "-",
      log.ip_address || "-",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  function viewDetails(log: AuditLog) {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{initialLogs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Set(initialLogs.map((l) => l.user_id).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actions Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {
                initialLogs.filter(
                  (l) =>
                    new Date(l.created_at).toDateString() === new Date().toDateString()
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Filtered Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredLogs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter audit logs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, description, or entity ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {uniqueEntities.map((entity) => (
                  <SelectItem key={entity} value={entity}>
                    {entity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {initialLogs.length} events
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Timestamp</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">User</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Action</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Entity</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Description</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">IP Address</th>
                  <th className="text-right p-3 font-semibold whitespace-nowrap">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 whitespace-nowrap">
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-medium">
                        {log.user_name || log.current_user_name || "System"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.user_email || log.current_user_email || "-"}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={actionColors[log.action] || "bg-gray-500/10"}
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={entityColors[log.entity_type] || "bg-gray-500/10"}
                      >
                        {log.entity_type}
                      </Badge>
                    </td>
                    <td className="p-3 max-w-md truncate">{log.description || "-"}</td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {log.ip_address || "-"}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDetails(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this audit event
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Timestamp</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold">User</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.user_name || selectedLog.current_user_name || "System"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLog.user_email || selectedLog.current_user_email || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold">Action</label>
                  <div className="mt-1">
                    <Badge variant="outline" className={actionColors[selectedLog.action]}>
                      {selectedLog.action}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold">Entity Type</label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={entityColors[selectedLog.entity_type]}
                    >
                      {selectedLog.entity_type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold">Entity ID</label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedLog.entity_id || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold">IP Address</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.ip_address || "-"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Description</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedLog.description || "-"}
                </p>
              </div>

              {selectedLog.old_values && (
                <div>
                  <label className="text-sm font-semibold">Old Values</label>
                  <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <label className="text-sm font-semibold">New Values</label>
                  <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <label className="text-sm font-semibold">User Agent</label>
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
