"use server"

import { sql } from "@/lib/db"
import { hashPassword, verifyPassword, createToken, setAuthCookie, clearAuthCookie } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { UserRole } from "@/lib/db"

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const role = (formData.get("role") as UserRole) || "customer"

  if (!email || !password || !fullName) {
    return { error: "All fields are required" }
  }

  try {
    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUsers.length > 0) {
      return { error: "User already exists" }
    }

    // Create user
    const passwordHash = await hashPassword(password)
    const users = await sql`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (${email}, ${passwordHash}, ${fullName}, ${role})
      RETURNING id
    `

    const userId = users[0].id
    const token = await createToken(userId)
    await setAuthCookie(token)

    return { success: true }
  } catch (error) {
    console.error("[v0] Sign up error:", error)
    return { error: "Failed to create account" }
  }
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    const users = await sql`
      SELECT id, password_hash FROM users WHERE email = ${email}
    `

    if (users.length === 0) {
      return { error: "Invalid credentials" }
    }

    const user = users[0]
    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      return { error: "Invalid credentials" }
    }

    const token = await createToken(user.id)
    await setAuthCookie(token)

    return { success: true }
  } catch (error) {
    console.error("[v0] Sign in error:", error)
    return { error: "Failed to sign in" }
  }
}

export async function signOut() {
  await clearAuthCookie()
  redirect("/login")
}
