'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { login } from '@/lib/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Eye, EyeOff, Package2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login: setSession } = useAuth()
  const [userCode, setUserCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userCode.trim() || !password) return
    setError('')
    setLoading(true)
    try {
      const session = await login(userCode.trim(), password)
      setSession(session.user, session.token)
      if (session.user.mustChangePassword) {
        router.push('/change-password')
      } else {
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <Package2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Royal Nutrition</h1>
          <p className="text-sm text-muted-foreground">Operations Portal</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sign in</CardTitle>
            <CardDescription className="text-xs">Use your user ID and password assigned by your admin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="userCode" className="text-xs">User ID</Label>
                <Input
                  id="userCode"
                  placeholder="e.g. ADMIN01"
                  value={userCode}
                  onChange={e => setUserCode(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading || !userCode || !password}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Forgot your user ID? Contact your administrator.
        </p>

        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">Demo credentials</summary>
          <div className="mt-2 space-y-1 pl-2 border-l border-border">
            <p>Admin: ADMIN01 / Admin@123</p>
            <p>Sub-admin: SADM01 / Sadm@123</p>
            <p>Floor Mgr: FLMGR01 / Floor@123</p>
            <p>Delivery Mgr: DLMGR01 / Delivery@123</p>
            <p>Rider: RIDER01 / Rider@123</p>
            <p>Accountant: ACCT01 / Acct@123</p>
          </div>
        </details>
      </div>
    </div>
  )
}
