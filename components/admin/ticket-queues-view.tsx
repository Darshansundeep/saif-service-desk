"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { assignTicket } from "@/app/actions/tickets"
import { useRouter } from "next/navigation"
import { 
  Users, 
  Inbox, 
  AlertCircle, 
  Clock, 
  Search,
  UserCheck,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

interface Agent {
  id: string
  full_name: string
  email: string
  agent_tier: string | null
  active_tickets: number
  open_tickets: number
  in_progress_tickets: number
  total_assigned: number
}

interface Ticket {
  id: string
  title: string
  priority: string
  status: string
  issue_type: string | null
  created_at: string
  assigned_to: string | null
  assigned_to_name: string | null
  assigned_to_tier: string | null
  requestor_email: string | null
  created_by_name: string
}

interface TicketQueuesViewProps {
  agents: Agent[]
  tickets: Ticket[]
  unassignedTickets: Ticket[]
}

const priorityColors = {
  low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
}

const statusColors = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  open: "bg-green-500/10 text-green-500 border-green-500/20",
  in_progress: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  resolved: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

export function TicketQueuesView({ agents, tickets, unassignedTickets }: TicketQueuesViewProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [tierFilter, setTierFilter] = useState<string>("all")
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = 
      searchTerm === "" ||
      agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTier = 
      tierFilter === "all" || 
      agent.agent_tier === tierFilter ||
      (tierFilter === "none" && !agent.agent_tier)
    
    return matchesSearch && matchesTier
  })

  const agentTickets = selectedAgent
    ? tickets.filter((t) => t.assigned_to === selectedAgent)
    : []

  async function handleAssign(ticketId: string, agentId: string | null) {
    setLoading(true)
    await assignTicket(ticketId, agentId)
    setLoading(false)
    setAssignDialogOpen(false)
    setSelectedTicket(null)
    router.refresh()
  }

  function openAssignDialog(ticket: Ticket) {
    setSelectedTicket(ticket)
    setAssignDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {agents.filter(a => a.agent_tier === 'L1').length} L1, {agents.filter(a => a.agent_tier === 'L2').length} L2
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Unassigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{unassignedTickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {tickets.filter(t => t.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Open Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {tickets.filter(t => t.status === 'open').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Tickets Section */}
      {unassignedTickets.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Unassigned Tickets ({unassignedTickets.length})
            </CardTitle>
            <CardDescription>These tickets need to be assigned to an agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unassignedTickets.slice(0, 5).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/tickets/${ticket.id}`}
                        className="font-medium hover:underline"
                      >
                        {ticket.title}
                      </Link>
                      <Badge
                        variant="outline"
                        className={priorityColors[ticket.priority as keyof typeof priorityColors]}
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {ticket.requestor_email}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => openAssignDialog(ticket)}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                </div>
              ))}
              {unassignedTickets.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{unassignedTickets.length - 5} more unassigned tickets
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Queues</CardTitle>
          <CardDescription>View and manage ticket assignments for each agent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="L1">L1 Only</SelectItem>
                <SelectItem value="L2">L2 Only</SelectItem>
                <SelectItem value="none">No Tier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agent List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => (
              <Card
                key={agent.id}
                className={`cursor-pointer transition-all ${
                  selectedAgent === agent.id
                    ? 'ring-2 ring-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{agent.full_name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{agent.email}</p>
                    </div>
                    {agent.agent_tier && (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                        {agent.agent_tier}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-bold text-orange-500">
                        {agent.active_tickets}
                      </div>
                      <div className="text-xs text-muted-foreground">Active</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-500">
                        {agent.open_tickets}
                      </div>
                      <div className="text-xs text-muted-foreground">Open</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-500">
                        {agent.in_progress_tickets}
                      </div>
                      <div className="text-xs text-muted-foreground">Working</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Agent's Tickets */}
      {selectedAgent && (
        <Card>
          <CardHeader>
            <CardTitle>
              {agents.find(a => a.id === selectedAgent)?.full_name}'s Queue
            </CardTitle>
            <CardDescription>
              {agentTickets.length} active ticket(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agentTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No active tickets assigned to this agent</p>
              </div>
            ) : (
              <div className="space-y-2">
                {agentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="font-medium hover:underline"
                        >
                          {ticket.title}
                        </Link>
                        <Badge
                          variant="outline"
                          className={priorityColors[ticket.priority as keyof typeof priorityColors]}
                        >
                          {ticket.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={statusColors[ticket.status as keyof typeof statusColors]}
                        >
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{ticket.requestor_email}</span>
                        <span>•</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        {ticket.issue_type && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{ticket.issue_type.replace('_', ' ')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAssignDialog(ticket)}
                    >
                      Reassign
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Ticket</DialogTitle>
            <DialogDescription>
              {selectedTicket?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {/* L1 Agents */}
              {agents.filter(a => a.agent_tier === 'L1').length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">L1 - Level 1 Support</h3>
                  {agents.filter(a => a.agent_tier === 'L1').map((agent) => (
                    <Button
                      key={agent.id}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => handleAssign(selectedTicket!.id, agent.id)}
                      disabled={loading}
                    >
                      <div className="text-left">
                        <div className="font-medium">{agent.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {agent.active_tickets} active tickets
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              )}

              {/* L2 Agents */}
              {agents.filter(a => a.agent_tier === 'L2').length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">L2 - Level 2 Support</h3>
                  {agents.filter(a => a.agent_tier === 'L2').map((agent) => (
                    <Button
                      key={agent.id}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => handleAssign(selectedTicket!.id, agent.id)}
                      disabled={loading}
                    >
                      <div className="text-left">
                        <div className="font-medium">{agent.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {agent.active_tickets} active tickets
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {selectedTicket?.assigned_to && (
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleAssign(selectedTicket.id, null)}
                  disabled={loading}
                >
                  Unassign Ticket
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
