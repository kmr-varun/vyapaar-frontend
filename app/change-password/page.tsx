'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { changePassword } from '@/lib/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { KeyRound } from 'lucide-react'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== confirm) { setError('Passwords do not match.'); return }
    if (!user) return
    setError('')
    setLoading(true)
    try {
      await changePassword(user.id, current, next)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Set New Password</h1>
          <p className="text-sm text-muted-foreground">Your account requires a password change.</p>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Change password</CardTitle>
            <CardDescription className="text-xs">At least 8 characters with a letter and a digit.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current" className="text-xs">Current password</Label>
                <Input id="current" type="password" value={current} onChange={e => setCurrent(e.target.value)} disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="next" className="text-xs">New password</Label>
                <Input id="next" type="password" value={next} onChange={e => setNext(e.target.value)} disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-xs">Confirm new password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} disabled={loading} />
              </div>
              {error && <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading || !current || !next || !confirm}>
                {loading ? 'Saving…' : 'Set new password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
