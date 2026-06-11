"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { FiLock, FiArrowRight } from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function PasswordGate() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push("/admin/dashboard")
      } else {
        toast.error("Incorrect password")
        setPassword("")
      }
    } catch {
      toast.error("Could not reach the server")
    } finally {
      setLoading(false)
    }
  }

  return (
    // --------- centered gate ---------
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div
            className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
          >
            <FiLock size={18} style={{ color: "var(--primary)" }} />
          </div>
          <CardTitle className="text-lg">Admin access</CardTitle>
          <CardDescription className="text-[13px]">
            Enter the admin password to manage scenario submissions.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-[13px]">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>

            <Button type="submit" disabled={!password.trim() || loading} className="gap-2">
              {loading ? "Checking…" : "Sign in"}
              {!loading && <FiArrowRight size={14} />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
