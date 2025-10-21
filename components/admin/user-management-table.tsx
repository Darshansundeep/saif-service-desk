"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { updateUserRole, deleteUser } from "@/app/actions/admin"
import { Edit, Trash2, Shield, User as UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  agent_tier?: string | null
  created_at: string
  updated_at: string
}

interface UserManagementTableProps {
  users: User[]
  currentUserId: string
}

const roleColors = {
  admin: "bg-red-500/10 text-red-500 border-red-500/20",
  agent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  customer: "bg-green-500/10 text-green-500 border-green-500/20",
}

const roleIcons = {
  admin: Shield,
  agent: UserIcon,
  customer: UserIcon,
}

export function UserManagementTable({ users, currentUserId }: UserManagementTableProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRoleChange(userId: string, newRole: string) {
    setLoading(true)
    const result = await updateUserRole(userId, newRole as any)
    
    if (result.error) {
      alert(result.error)
    } else {
      setEditingUserId(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDeleteUser() {
    if (!deleteUserId) return
    
    setLoading(true)
    const result = await deleteUser(deleteUserId)
    
    if (result.error) {
      alert(result.error)
    } else {
      setDeleteUserId(null)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold">User</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Role</th>
                  <th className="text-left p-4 font-semibold">Tier</th>
                  <th className="text-left p-4 font-semibold">Created</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const RoleIcon = roleIcons[user.role as keyof typeof roleIcons]
                  const isCurrentUser = user.id === currentUserId
                  const isEditing = editingUserId === user.id

                  return (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <RoleIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{user.full_name}</span>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-xs">You</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{user.email}</td>
                      <td className="p-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Select
                              defaultValue={user.role}
                              onValueChange={(value) => handleRoleChange(user.id, value)}
                              disabled={loading}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUserId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="outline" className={roleColors[user.role as keyof typeof roleColors]}>
                            {user.role}
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        {user.agent_tier ? (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                            {user.agent_tier}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {!isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUserId(user.id)}
                              disabled={isCurrentUser}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteUserId(user.id)}
                            disabled={isCurrentUser || loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
              All tickets created by this user will remain in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
