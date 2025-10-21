"use server"

import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string

  if (!email) {
    return { error: "Email is required" }
  }

  try {
    // Check if user exists
    const users = await sql`
      SELECT id, email, full_name FROM users WHERE email = ${email}
    `

    if (users.length === 0) {
      // Don't reveal if user exists or not for security
      return { 
        success: true, 
        message: "If an account exists with this email, you will receive a password reset link." 
      }
    }

    const user = users[0]

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now

    // Store token in database
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `

    // In a real application, send email here
    // For now, we'll log the reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`
    
    console.log('='.repeat(80))
    console.log('PASSWORD RESET REQUEST')
    console.log('='.repeat(80))
    console.log(`User: ${user.full_name} (${user.email})`)
    console.log(`Reset Link: ${resetLink}`)
    console.log(`Token expires: ${expiresAt.toLocaleString()}`)
    console.log('='.repeat(80))

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, user.full_name, resetLink)

    return { 
      success: true, 
      message: "If an account exists with this email, you will receive a password reset link.",
      // For development only - remove in production
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
    }
  } catch (error) {
    console.error("[Password Reset] Request error:", error)
    return { error: "Failed to process password reset request" }
  }
}

export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirm_password") as string

  if (!token || !password || !confirmPassword) {
    return { error: "All fields are required" }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long" }
  }

  try {
    // Find valid token
    const tokens = await sql`
      SELECT 
        prt.id,
        prt.user_id,
        prt.expires_at,
        prt.used,
        u.email,
        u.full_name
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = ${token}
        AND prt.used = FALSE
        AND prt.expires_at > NOW()
    `

    if (tokens.length === 0) {
      return { error: "Invalid or expired reset token" }
    }

    const tokenData = tokens[0]

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10)

    // Update user password
    await sql`
      UPDATE users
      SET password_hash = ${passwordHash},
          updated_at = NOW()
      WHERE id = ${tokenData.user_id}
    `

    // Mark token as used
    await sql`
      UPDATE password_reset_tokens
      SET used = TRUE
      WHERE id = ${tokenData.id}
    `

    console.log(`[Password Reset] Password reset successful for user: ${tokenData.email}`)

    return { 
      success: true, 
      message: "Password reset successful. You can now login with your new password." 
    }
  } catch (error) {
    console.error("[Password Reset] Reset error:", error)
    return { error: "Failed to reset password" }
  }
}

export async function validateResetToken(token: string) {
  try {
    const tokens = await sql`
      SELECT 
        prt.expires_at,
        prt.used,
        u.email
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = ${token}
    `

    if (tokens.length === 0) {
      return { valid: false, error: "Invalid reset token" }
    }

    const tokenData = tokens[0]

    if (tokenData.used) {
      return { valid: false, error: "This reset link has already been used" }
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return { valid: false, error: "This reset link has expired" }
    }

    return { valid: true, email: tokenData.email }
  } catch (error) {
    console.error("[Password Reset] Validate token error:", error)
    return { valid: false, error: "Failed to validate token" }
  }
}
