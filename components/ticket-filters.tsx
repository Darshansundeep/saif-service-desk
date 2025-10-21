"use client"

import type React from "react"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X, Circle, AlertCircle, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useState } from "react"
import type { UserRole } from "@/lib/db"

interface TicketFiltersProps {
  agents: Array<{ id: string; full_name: string }>
  currentRole: UserRole
  statusCounts: Record<string, number>
  currentStatus?: string
}

export function TicketFilters({ agents, currentRole, statusCounts, currentStatus }: TicketFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/tickets?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateFilter("search", search)
  }

  function clearFilters() {
    setSearch("")
    router.push("/tickets")
  }

  const hasFilters = searchParams.toString().length > 0

  const statusBlocks = [
    { 
      key: 'new', 
      label: 'New', 
      icon: Circle, 
      color: 'bg-blue-500', 
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    { 
      key: 'open', 
      label: 'Open', 
      icon: AlertCircle, 
      color: 'bg-cyan-500', 
      textColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950',
      borderColor: 'border-cyan-200 dark:border-cyan-800'
    },
    { 
      key: 'escalated', 
      label: 'Escalated', 
      icon: AlertTriangle, 
      color: 'bg-orange-500', 
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      borderColor: 'border-orange-200 dark:border-orange-800'
    },
    { 
      key: 'in_progress', 
      label: 'In Progress', 
      icon: Clock, 
      color: 'bg-yellow-500', 
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    { 
      key: 'resolved', 
      label: 'Resolved', 
      icon: CheckCircle, 
      color: 'bg-green-500', 
      textColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    { 
      key: 'cancelled', 
      label: 'Cancelled', 
      icon: XCircle, 
      color: 'bg-gray-500', 
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-950',
      borderColor: 'border-gray-200 dark:border-gray-800'
    },
  ]

  function handleStatusClick(status: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (currentStatus === status) {
      // If clicking the same status, clear the filter
      params.delete('status')
    } else {
      params.set('status', status)
    }
    params.delete('page') // Reset to page 1 when filtering
    router.push(`/tickets?${params.toString()}`)
  }

  const totalTickets = Object.values(statusCounts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="space-y-4 mb-6">
      {/* Status Filter Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* All Tickets Block */}
        <button
          onClick={() => handleStatusClick('')}
          className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md ${
            !currentStatus
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-gray-200 dark:border-gray-800 bg-card hover:border-gray-300'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className={`p-2 rounded-full ${
              !currentStatus ? 'bg-primary/10' : 'bg-muted'
            }`}>
              <Search className={`h-5 w-5 ${
                !currentStatus ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalTickets}</div>
              <div className="text-xs text-muted-foreground font-medium">All Tickets</div>
            </div>
          </div>
        </button>

        {/* Status Blocks */}
        {statusBlocks.map((block) => {
          const Icon = block.icon
          const count = statusCounts[block.key] || 0
          const isActive = currentStatus === block.key

          return (
            <button
              key={block.key}
              onClick={() => handleStatusClick(block.key)}
              className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                isActive
                  ? `${block.borderColor} ${block.bgColor} shadow-sm`
                  : 'border-gray-200 dark:border-gray-800 bg-card hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`p-2 rounded-full ${
                  isActive ? block.color + ' bg-opacity-10' : 'bg-muted'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    isActive ? block.textColor : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground font-medium">{block.label}</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Existing Filters */}
      <div className="bg-card border rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Select value={searchParams.get("status") || "all"} onValueChange={(value) => updateFilter("status", value)}>
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
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

        <Select
          value={searchParams.get("priority") || "all"}
          onValueChange={(value) => updateFilter("priority", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        {currentRole !== "customer" && (
          <Select
            value={searchParams.get("assignee") || "all"}
            onValueChange={(value) => updateFilter("assignee", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

        {hasFilters && (
          <div className="mt-4">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
