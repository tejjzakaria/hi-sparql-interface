"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  FiLogOut, FiCheck, FiX, FiEye, FiRefreshCw, FiInbox, FiDownload,
} from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Navbar } from "@/components/layout/Navbar"
import { CQ_QUERIES } from "@/lib/cq-queries"
import type { StudyResponse } from "@/lib/db"

// --------- submission type ---------
interface PendingSubmission {
  id: string
  title: string
  submitter: string | null
  status: string
  turtle_ttl: string
  created_at: number
  reviewed_at: number | null
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatCQ(cqId: string) {
  const cq = CQ_QUERIES[cqId]
  const num = cqId.match(/cq(\d+)/)?.[1] ?? "?"
  return cq ? `CQ${num} · ${cq.title}` : cqId
}

export function AdminDashboard() {
  const router = useRouter()

  // --------- submissions state ---------
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [previewSub, setPreviewSub] = useState<PendingSubmission | null>(null)

  // --------- responses state ---------
  const [responses, setResponses] = useState<StudyResponse[]>([])
  const [responsesLoading, setResponsesLoading] = useState(false)
  const [responsesLoaded, setResponsesLoaded] = useState(false)

  // --------- fetch submissions ---------
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/submissions")
      if (res.status === 401) { router.replace("/admin"); return }
      const data = await res.json()
      setSubmissions(data.submissions ?? [])
    } catch {
      toast.error("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  // --------- fetch responses ---------
  const loadResponses = useCallback(async () => {
    if (responsesLoaded) return
    setResponsesLoading(true)
    try {
      const res = await fetch("/api/admin/study-responses")
      if (res.status === 401) { router.replace("/admin"); return }
      const data = await res.json()
      setResponses(data.responses ?? [])
      setResponsesLoaded(true)
    } catch {
      toast.error("Failed to load responses")
    } finally {
      setResponsesLoading(false)
    }
  }, [responsesLoaded, router])

  // --------- approve ---------
  async function approve(id: string) {
    setActionId(id)
    try {
      const res = await fetch(`/api/admin/submissions/${id}/approve`, { method: "POST" })
      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== id))
        toast.success("Scenario approved and loaded into the knowledge graph.")
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Approval failed")
      }
    } catch {
      toast.error("Network error during approval")
    } finally {
      setActionId(null)
    }
  }

  // --------- reject ---------
  async function reject(id: string) {
    setActionId(id)
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" })
      if (res.ok || res.status === 204) {
        setSubmissions(prev => prev.filter(s => s.id !== id))
        toast.success("Submission rejected and removed.")
      } else {
        toast.error("Rejection failed")
      }
    } catch {
      toast.error("Network error during rejection")
    } finally {
      setActionId(null)
    }
  }

  // --------- logout ---------
  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" }).catch(() => {})
    router.replace("/admin")
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* --------- header row --------- */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Admin
            </h1>
            <p className="mt-0.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
              Manage submissions and view study responses.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={logout} className="gap-1.5 text-[13px]">
            <FiLogOut size={13} />
            Sign out
          </Button>
        </div>

        <Separator className="mb-6" />

        <Tabs
          defaultValue="submissions"
          onValueChange={(v) => { if (v === "responses") loadResponses() }}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="responses">Study Responses</TabsTrigger>
          </TabsList>

          {/* --------- submissions tab --------- */}
          <TabsContent value="submissions">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                Review and approve or reject user-submitted scenarios.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={load}
                disabled={loading}
                className="gap-1.5 text-[13px]"
              >
                <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : submissions.length === 0 ? (
              // --------- empty state ---------
              <div className="flex flex-col items-center gap-3 py-20">
                <FiInbox size={32} style={{ color: "var(--text-muted)" }} />
                <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
                  No pending submissions
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Submitter</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map(sub => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium text-[13px]" style={{ color: "var(--text-primary)" }}>
                        {sub.title}
                      </TableCell>

                      <TableCell className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                        {sub.submitter ?? (
                          <Badge variant="outline" className="text-[11px]">Anonymous</Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                        {formatDate(sub.created_at)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-[12px]"
                            onClick={() => setPreviewSub(sub)}
                          >
                            <FiEye size={13} />
                            Preview
                          </Button>

                          <Button
                            size="sm"
                            className="gap-1.5 text-[12px]"
                            disabled={actionId === sub.id}
                            onClick={() => approve(sub.id)}
                            style={{ backgroundColor: "var(--primary)", color: "white" }}
                          >
                            <FiCheck size={13} />
                            Approve
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1.5 text-[12px]"
                            disabled={actionId === sub.id}
                            onClick={() => reject(sub.id)}
                          >
                            <FiX size={13} />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* --------- responses tab --------- */}
          <TabsContent value="responses">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                Post-session questionnaire responses from study participants.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-[13px]"
                onClick={() => { window.location.href = "/api/admin/study-responses/export" }}
              >
                <FiDownload size={13} />
                Export CSV
              </Button>
            </div>

            {responsesLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : responses.length === 0 ? (
              // --------- empty state ---------
              <div className="flex flex-col items-center gap-3 py-20">
                <FiInbox size={32} style={{ color: "var(--text-muted)" }} />
                <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
                  No responses yet
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Familiarity</TableHead>
                    <TableHead>CQ assigned</TableHead>
                    <TableHead className="text-center">Q1</TableHead>
                    <TableHead className="text-center">Q2</TableHead>
                    <TableHead className="text-center">Q3</TableHead>
                    <TableHead className="text-center">Q4</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-[13px]" style={{ color: "var(--text-primary)" }}>
                        {r.participant_name}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[11px] capitalize">
                          {r.sparql_familiarity}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-[12px] max-w-[180px]" style={{ color: "var(--text-muted)" }}>
                        {formatCQ(r.cq_id)}
                      </TableCell>

                      {[r.q1, r.q2, r.q3, r.q4].map((rating, i) => (
                        <TableCell key={i} className="text-center">
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded text-[12px] font-semibold"
                            style={{
                              backgroundColor: rating >= 4
                                ? "color-mix(in srgb, var(--success) 15%, transparent)"
                                : rating <= 2
                                  ? "color-mix(in srgb, var(--error) 15%, transparent)"
                                  : "var(--surface)",
                              color: rating >= 4
                                ? "var(--success)"
                                : rating <= 2
                                  ? "var(--error)"
                                  : "var(--text-muted)",
                            }}
                          >
                            {rating}
                          </span>
                        </TableCell>
                      ))}

                      <TableCell
                        className="text-[12px] max-w-[160px] truncate"
                        style={{ color: "var(--text-muted)" }}
                        title={r.q5_comments ?? ""}
                      >
                        {r.q5_comments ?? <span style={{ opacity: 0.4 }}>—</span>}
                      </TableCell>

                      <TableCell className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                        {formatDate(r.submitted_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* --------- ttl preview sheet --------- */}
      <Sheet open={!!previewSub} onOpenChange={open => !open && setPreviewSub(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-base">{previewSub?.title}</SheetTitle>
            <SheetDescription className="text-[12px]">
              Generated Turtle for this submission
            </SheetDescription>
          </SheetHeader>

          <pre
            className="rounded-lg p-4 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            {previewSub?.turtle_ttl}
          </pre>
        </SheetContent>
      </Sheet>
    </div>
  )
}
