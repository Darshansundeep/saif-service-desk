import { sql } from "./db"

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // Get SMTP settings from database
    const settings = await sql`
      SELECT setting_key, setting_value
      FROM system_settings
      WHERE setting_key IN (
        'smtp_enabled', 'smtp_host', 'smtp_port', 'smtp_user', 
        'smtp_password', 'smtp_from_email', 'smtp_from_name'
      )
    `

    const settingsMap: Record<string, string> = {}
    settings.forEach((s: any) => {
      settingsMap[s.setting_key] = s.setting_value
    })

    // Check if SMTP is enabled
    if (settingsMap.smtp_enabled !== 'true') {
      console.log('[Email] SMTP is disabled. Email not sent:', options.subject)
      return { success: false, error: 'SMTP is disabled in settings' }
    }

    // Validate required settings
    if (!settingsMap.smtp_host || !settingsMap.smtp_user || !settingsMap.smtp_password) {
      console.log('[Email] SMTP not configured. Email not sent:', options.subject)
      return { success: false, error: 'SMTP not configured' }
    }

    // Note: Actual email sending requires nodemailer
    // For now, we'll log the email details
    console.log('[Email] Would send email:', {
      from: `${settingsMap.smtp_from_name} <${settingsMap.smtp_from_email}>`,
      to: options.to,
      subject: options.subject,
      smtp: `${settingsMap.smtp_host}:${settingsMap.smtp_port}`,
    })

    // TODO: Implement actual email sending with nodemailer
    // const nodemailer = require('nodemailer')
    // const transporter = nodemailer.createTransport({
    //   host: settingsMap.smtp_host,
    //   port: parseInt(settingsMap.smtp_port),
    //   secure: parseInt(settingsMap.smtp_port) === 465,
    //   auth: {
    //     user: settingsMap.smtp_user,
    //     pass: settingsMap.smtp_password,
    //   },
    // })
    // 
    // await transporter.sendMail({
    //   from: `${settingsMap.smtp_from_name} <${settingsMap.smtp_from_email}>`,
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html,
    //   text: options.text,
    // })

    return { success: true }
  } catch (error) {
    console.error('[Email] Send error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendTicketAcknowledgment(
  ticketId: string,
  ticketTitle: string,
  requestorEmail: string,
  requestorName?: string
): Promise<{ success: boolean; error?: string }> {
  const name = requestorName || requestorEmail.split('@')[0]

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4F46E5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #f9fafb;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .ticket-ref {
          background-color: #EEF2FF;
          border-left: 4px solid #4F46E5;
          padding: 15px;
          margin: 20px 0;
          font-family: monospace;
          font-size: 16px;
        }
        .footer {
          background-color: #f3f4f6;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          background-color: #4F46E5;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Ticket Acknowledgment</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          
          <p>Thank you for contacting our Service Desk. We have received your request and have created a support ticket for you.</p>
          
          <div class="ticket-ref">
            <strong>Ticket Reference:</strong> ${ticketId.substring(0, 8).toUpperCase()}<br>
            <strong>Subject:</strong> ${ticketTitle}
          </div>
          
          <p>Our team has acknowledged your request and we have started working on it. You will receive updates as we progress with your ticket.</p>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Your ticket has been assigned to our support team</li>
            <li>We will review your request and prioritize accordingly</li>
            <li>You will receive email notifications for any updates</li>
            <li>Our team will work to resolve your issue as quickly as possible</li>
          </ul>
          
          <p>If you have any additional information to add, please reply to this email with your ticket reference number.</p>
          
          <p>Thank you for your patience.</p>
          
          <p>Best regards,<br>
          <strong>Service Desk Support Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply directly to this email.</p>
          <p>For urgent matters, please contact our support team directly.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Dear ${name},

Thank you for contacting our Service Desk. We have received your request and have created a support ticket for you.

Ticket Reference: ${ticketId.substring(0, 8).toUpperCase()}
Subject: ${ticketTitle}

Our team has acknowledged your request and we have started working on it. You will receive updates as we progress with your ticket.

What happens next?
- Your ticket has been assigned to our support team
- We will review your request and prioritize accordingly
- You will receive email notifications for any updates
- Our team will work to resolve your issue as quickly as possible

If you have any additional information to add, please reply to this email with your ticket reference number.

Thank you for your patience.

Best regards,
Service Desk Support Team

---
This is an automated message. Please do not reply directly to this email.
For urgent matters, please contact our support team directly.
  `

  return sendEmail({
    to: requestorEmail,
    subject: `Ticket Acknowledged - Ref: ${ticketId.substring(0, 8).toUpperCase()}`,
    html,
    text,
  })
}
