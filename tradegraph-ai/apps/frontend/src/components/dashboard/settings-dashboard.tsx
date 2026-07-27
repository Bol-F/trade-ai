"use client"

import { useState } from "react"
import { KeyRound, LockKeyhole, MonitorSmartphone, ShieldCheck, Trash2, UserRound, WalletCards } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiError, authApi } from "@/lib/api"

export function SettingsDashboard() {
  const { user } = useAuth()
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function changePassword(formData: FormData) {
    setSaving(true)
    setStatus(null)
    const currentPassword = String(formData.get("currentPassword") || "")
    const newPassword = String(formData.get("newPassword") || "")
    const confirmPassword = String(formData.get("confirmPassword") || "")
    if (newPassword !== confirmPassword) {
      setStatus({ tone: "error", message: "New password and confirmation do not match." })
      setSaving(false)
      return
    }
    try {
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword })
      setStatus({ tone: "success", message: "Password changed successfully." })
    } catch (error) {
      setStatus({ tone: "error", message: error instanceof ApiError ? error.message : "Password could not be changed." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DashboardPageHeader title="Settings" description="Manage the account capabilities currently supported by Trade AI and review unavailable integrations transparently." />
      <Tabs defaultValue="profile">
        <TabsList aria-label="Settings categories" className="max-w-full overflow-x-auto"><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger><TabsTrigger value="notifications">Notifications</TabsTrigger><TabsTrigger value="appearance">Appearance</TabsTrigger><TabsTrigger value="account">Account</TabsTrigger></TabsList>
        <TabsContent value="profile" className="mt-4"><Card className="max-w-3xl shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound aria-hidden="true" className="size-4 text-primary" />Personal profile</CardTitle><CardDescription>Profile values are loaded from the authenticated backend account.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="profile-first-name">First name</Label><Input id="profile-first-name" value={user?.first_name ?? ""} readOnly /></div><div className="grid gap-2"><Label htmlFor="profile-last-name">Last name</Label><Input id="profile-last-name" value={user?.last_name ?? ""} readOnly /></div><div className="grid gap-2 sm:col-span-2"><Label htmlFor="profile-email">Email</Label><Input id="profile-email" value={user?.email ?? ""} readOnly /></div><p className="text-xs text-muted-foreground sm:col-span-2">Profile editing is not exposed by the current backend API, so these fields are intentionally read-only.</p></CardContent></Card></TabsContent>
        <TabsContent value="security" className="mt-4 space-y-4">
          <Card className="max-w-3xl shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><KeyRound aria-hidden="true" className="size-4 text-primary" />Change password</CardTitle><CardDescription>This form uses the implemented authenticated password-change endpoint.</CardDescription></CardHeader><CardContent><form action={changePassword} className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2 sm:col-span-2"><Label htmlFor="current-password">Current password</Label><Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required /></div><div className="grid gap-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={10} required /></div><div className="grid gap-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required /></div>{status && <Alert variant={status.tone === "error" ? "destructive" : "default"} className="sm:col-span-2"><AlertTitle>{status.tone === "error" ? "Password not changed" : "Password updated"}</AlertTitle><AlertDescription>{status.message}</AlertDescription></Alert>}<Button loading={saving} className="sm:col-span-2 sm:w-fit">Update password</Button></form></CardContent></Card>
          <Card className="max-w-3xl shadow-none"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck aria-hidden="true" className="size-4 text-muted-foreground" />Two-factor authentication</CardTitle><Badge variant="secondary">Not supported</Badge></div><CardDescription>The current backend has no two-factor enrollment, verification, or recovery model.</CardDescription></CardHeader><CardContent><Button disabled variant="outline">Enable two-factor authentication</Button></CardContent></Card>
          <Card className="max-w-3xl shadow-none"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base"><MonitorSmartphone aria-hidden="true" className="size-4 text-muted-foreground" />Active sessions</CardTitle><Badge variant="secondary">Not available</Badge></div><CardDescription>Session inventory and remote revocation are not implemented by the backend.</CardDescription></CardHeader></Card>
        </TabsContent>
        <TabsContent value="notifications" className="mt-4"><Card className="max-w-3xl shadow-none"><CardHeader><CardTitle className="text-base">Notification preferences</CardTitle><CardDescription>These controls demonstrate the intended interface. Preferences are not persisted yet.</CardDescription></CardHeader><CardContent className="divide-y">{[["Signal changes", "Notify when an AI signal changes type or confidence."], ["Risk thresholds", "Notify when monitored risk moves above a selected level."], ["Market events", "Notify before important scheduled market events."], ["Weekly summary", "Receive a weekly analytical digest."]].map(([title, description], index) => <div key={title} className="flex items-center justify-between gap-5 py-4"><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div><Switch defaultChecked={index < 2} aria-label={title} /></div>)}</CardContent></Card></TabsContent>
        <TabsContent value="appearance" className="mt-4"><Card className="max-w-3xl shadow-none"><CardHeader><CardTitle className="text-base">Appearance</CardTitle><CardDescription>Theme preference is supported and stored by the existing theme provider.</CardDescription></CardHeader><CardContent className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">Color theme</p><p className="mt-1 text-xs text-muted-foreground">Switch between the accessible light and dark themes.</p></div><ThemeToggle /></CardContent></Card></TabsContent>
        <TabsContent value="account" className="mt-4 space-y-4"><Card className="max-w-3xl shadow-none"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base"><WalletCards aria-hidden="true" className="size-4 text-muted-foreground" />Subscription & connected accounts</CardTitle><Badge variant="secondary">Not implemented</Badge></div><CardDescription>No billing, brokerage connection, or external account integration exists in the current backend.</CardDescription></CardHeader></Card><Card className="max-w-3xl border-destructive/30 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-destructive"><Trash2 aria-hidden="true" className="size-4" />Delete account</CardTitle><CardDescription>Permanent account deletion is not exposed by the current API. The action remains disabled to avoid implying otherwise.</CardDescription></CardHeader><CardContent><Button disabled variant="destructive"><LockKeyhole aria-hidden="true" />Delete account</Button></CardContent></Card></TabsContent>
      </Tabs>
    </>
  )
}
