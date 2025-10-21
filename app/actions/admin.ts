"use server"

import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { UserRole } from "@/lib/db"

export async function updateUserRole(userId: string, newRole: UserRole) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized" }
  }

  // Prevent admin from changing their own role
  if (currentUser.id === userId) {
    return { error: "Cannot change your own role" }
  }

  try {
    await sql`
      UPDATE users
      SET role = ${newRole}, updated_at = NOW()
      WHERE id = ${userId}
    `

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("[Admin] Update user role error:", error)
    return { error: "Failed to update user role" }
  }
}

export async function deleteUser(userId: string) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized" }
  }

  // Prevent admin from deleting themselves
  if (currentUser.id === userId) {
    return { error: "Cannot delete your own account" }
  }

  try {
    await sql`
      DELETE FROM users
      WHERE id = ${userId}
    `

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("[Admin] Delete user error:", error)
    return { error: "Failed to delete user" }
  }
}

export async function createUser(formData: FormData) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized" }
  }

  const email = formData.get("email") as string
  const fullName = formData.get("full_name") as string
  const role = formData.get("role") as UserRole
  const password = formData.get("password") as string
  const agentTier = formData.get("agent_tier") as string | null

  if (!email || !fullName || !role || !password) {
    return { error: "All fields are required" }
  }

  // Validate agent tier for agents
  if (role === "agent" && !agentTier) {
    return { error: "Agent tier is required for agent role" }
  }

  try {
    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUsers.length > 0) {
      return { error: "User with this email already exists" }
    }

    // Hash password
    const bcrypt = require("bcryptjs")
    const passwordHash = await bcrypt.hash(password, 10)

    // Insert user with agent_tier if role is agent
    if (role === "agent") {
      await sql`
        INSERT INTO users (email, password_hash, full_name, role, agent_tier)
        VALUES (${email}, ${passwordHash}, ${fullName}, ${role}, ${agentTier})
      `
    } else {
      await sql`
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES (${email}, ${passwordHash}, ${fullName}, ${role})
      `
    }

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("[Admin] Create user error:", error)
    return { error: "Failed to create user" }
  }
}
