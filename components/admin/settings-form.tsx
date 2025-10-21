"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { updateSettings, testSmtpConnection } from "@/app/actions/settings"
import { Mail, Bell, Shield, Database, CheckCircle, AlertCircle, Image as ImageIcon, Upload } from "lucide-react"
import { CompanyLogo } from "@/components/company-logo"
import Image from "next/image"

interface SettingsFormProps {
  initialSettings: Record<string, any>
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [testingSmtp, setTestingSmtp] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [smtpMessage, setSmtpMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [logoMessage, setLogoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState(initialSettings.company_name || "Your Company")
  const [companyTagline, setCompanyTagline] = useState(initialSettings.company_tagline || "Service Desk")
  const router = useRouter()

  // Email settings state
  const [smtpEnabled, setSmtpEnabled] = useState(initialSettings.smtp_enabled === "true")
  const [notifyNewTicket, setNotifyNewTicket] = useState(initialSettings.notify_new_ticket === "true")
  const [notifyStatusChange, setNotifyStatusChange] = useState(initialSettings.notify_status_change === "true")
  const [notifyAssignment, setNotifyAssignment] = useState(initialSettings.notify_assignment === "true")

  async function handleSaveEmailSettings(formData: FormData) {
    setLoading(true)
    setMessage(null)

    // Add toggle states to form data
    formData.set("smtp_enabled", smtpEnabled.toString())
    formData.set("notify_new_ticket", notifyNewTicket.toString())
    formData.set("notify_status_change", notifyStatusChange.toString())
    formData.set("notify_assignment", notifyAssignment.toString())

    const result = await updateSettings(formData)

    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: result.message || "Settings saved successfully" })
      router.refresh()
    }
    setLoading(false)
  }

  async function handleTestSmtp(formData: FormData) {
    setTestingSmtp(true)
    setSmtpMessage(null)

    const result = await testSmtpConnection(formData)

    if (result.error) {
      setSmtpMessage({ type: "error", text: result.error })
    } else {
      setSmtpMessage({ type: "success", text: result.message || "Connection successful" })
    }
    setTestingSmtp(false)
  }

  async function handleLogoUpload(formData: FormData) {
    setUploadingLogo(true)
    setLogoMessage(null)

    // Add company name and tagline to form data
    formData.set("company_name", companyName)
    formData.set("company_tagline", companyTagline)

    const result = await updateSettings(formData)

    if (result.error) {
      setLogoMessage({ type: "error", text: result.error })
    } else {
      setLogoMessage({ type: "success", text: "Branding settings saved successfully" })
      router.refresh()
    }
    setUploadingLogo(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            <CardTitle>Company Branding</CardTitle>
          </div>
          <CardDescription>Upload your company logo and customize branding</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleLogoUpload} className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your Company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_tagline">Tagline</Label>
                    <Input
                      id="company_tagline"
                      value={companyTagline}
                      onChange={(e) => setCompanyTagline(e.target.value)}
                      placeholder="Service Desk"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo">Company Logo</Label>
                    <Input
                      id="logo"
                      name="logo"
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, or SVG. Recommended: 512x512px, square aspect ratio
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="text-sm font-medium">Current Logo</div>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <CompanyLogo size="lg" showText={true} />
                  </div>
                  {logoPreview && (
                    <>
                      <div className="text-sm font-medium">Preview</div>
                      <div className="border rounded-lg p-4 bg-muted/30">
                        <Image
                          src={logoPreview}
                          alt="Logo preview"
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {logoMessage && (
              <div className={`flex items-center gap-2 p-3 rounded ${
                logoMessage.type === "success" 
                  ? "bg-green-500/10 text-green-500" 
                  : "bg-destructive/10 text-destructive"
              }`}>
                {logoMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">{logoMessage.text}</span>
              </div>
            )}

            <Button type="submit" disabled={uploadingLogo}>
              <Upload className="h-4 w-4 mr-2" />
              {uploadingLogo ? "Saving..." : "Save Branding Settings"}
            </Button>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Note:</strong> After uploading a logo, you need to update the logo component to use it. 
                See <code className="bg-muted px-1 py-0.5 rounded">LOGO_CUSTOMIZATION.md</code> for instructions.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>


      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Notifications (SMTP Configuration)</CardTitle>
          </div>
          <CardDescription>Configure email notification settings and SMTP server</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSaveEmailSettings} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Master switch for all email notifications
                  </p>
                </div>
                <Switch checked={smtpEnabled} onCheckedChange={setSmtpEnabled} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Ticket Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email when new tickets are created
                  </p>
                </div>
                <Switch checked={notifyNewTicket} onCheckedChange={setNotifyNewTicket} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status Change Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify users when ticket status changes
                  </p>
                </div>
                <Switch checked={notifyStatusChange} onCheckedChange={setNotifyStatusChange} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Assignment Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify agents when tickets are assigned
                  </p>
                </div>
                <Switch checked={notifyAssignment} onCheckedChange={setNotifyAssignment} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="smtp_host">SMTP Server *</Label>
                <Input
                  id="smtp_host"
                  name="smtp_host"
                  placeholder="smtp.gmail.com"
                  defaultValue={initialSettings.smtp_host}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Port *</Label>
                  <Input
                    id="smtp_port"
                    name="smtp_port"
                    type="number"
                    placeholder="587"
                    defaultValue={initialSettings.smtp_port}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_user">SMTP Username *</Label>
                  <Input
                    id="smtp_user"
                    name="smtp_user"
                    placeholder="user@example.com"
                    defaultValue={initialSettings.smtp_user}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_password">SMTP Password *</Label>
                <Input
                  id="smtp_password"
                  name="smtp_password"
                  type="password"
                  placeholder="••••••••"
                  defaultValue={initialSettings.smtp_password}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep existing password
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_from_email">From Email *</Label>
                  <Input
                    id="smtp_from_email"
                    name="smtp_from_email"
                    type="email"
                    placeholder="noreply@example.com"
                    defaultValue={initialSettings.smtp_from_email}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_from_name">From Name *</Label>
                  <Input
                    id="smtp_from_name"
                    name="smtp_from_name"
                    placeholder="Service Desk"
                    defaultValue={initialSettings.smtp_from_name}
                    required
                  />
                </div>
              </div>
            </div>

            {message && (
              <div className={`flex items-center gap-2 p-3 rounded ${
                message.type === "success" 
                  ? "bg-green-500/10 text-green-500" 
                  : "bg-destructive/10 text-destructive"
              }`}>
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            {smtpMessage && (
              <div className={`flex items-center gap-2 p-3 rounded ${
                smtpMessage.type === "success" 
                  ? "bg-green-500/10 text-green-500" 
                  : "bg-destructive/10 text-destructive"
              }`}>
                {smtpMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">{smtpMessage.text}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Email Settings"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const form = document.querySelector('form') as HTMLFormElement
                  const formData = new FormData(form)
                  handleTestSmtp(formData)
                }}
                disabled={testingSmtp}
              >
                {testingSmtp ? "Testing..." : "Test SMTP Connection"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Email sending requires nodemailer package. Install with: <code className="bg-muted px-1 py-0.5 rounded">npm install nodemailer</code>
            </p>
          </form>
        </CardContent>
      </Card>

      {/* System Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>System Notifications</CardTitle>
          </div>
          <CardDescription>Configure in-app notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateSettings} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notification_retention_days">Notification Retention (days)</Label>
                <Input
                  id="notification_retention_days"
                  name="notification_retention_days"
                  type="number"
                  defaultValue={initialSettings.notification_retention_days || "30"}
                  min="1"
                  max="365"
                />
                <p className="text-xs text-muted-foreground">
                  Automatically delete notifications older than this many days
                </p>
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Notification Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Storage Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>File Storage</CardTitle>
          </div>
          <CardDescription>Configure file upload settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateSettings} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max_file_size_mb">Max File Upload Size (MB)</Label>
                <Input
                  id="max_file_size_mb"
                  name="max_file_size_mb"
                  type="number"
                  defaultValue={initialSettings.max_file_size_mb || "10"}
                  min="1"
                  max="100"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum size for file attachments
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowed_extensions">Allowed File Extensions</Label>
                <Input
                  id="allowed_extensions"
                  name="allowed_extensions"
                  defaultValue={initialSettings.allowed_extensions || ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip"}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of allowed file extensions
                </p>
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Storage Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
