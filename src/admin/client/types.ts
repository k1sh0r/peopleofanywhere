export type App = {
  id: string
  user_id: string
  email: string
  why: string
  /** optional, +<country><number> (supabase/migrations/20261013160000_application_whatsapp.sql) */
  whatsapp?: string | null
  profile: {
    name?: string
    role?: string
    company?: string | null
    location?: string
    building?: string | null
    previously?: string | null
    skills?: string[]
    portfolio?: string | null
    linkedin?: string | null
    x?: string | null
    open_to_work?: boolean
  }
  status: 'draft' | 'submitted' | 'paid' | 'under_review' | 'approved' | 'rejected' | 'refunded' | 'refund_failed'
  payment_id: string | null
  amount: number | null
  currency: string | null
  reason: string | null
  paid_at: string | null
  decided_at: string | null
  created_at: string
}

export const TABS = [
  { id: 'queue', label: 'TO REVIEW', statuses: ['paid', 'under_review'] },
  { id: 'problems', label: 'REFUND FAILED', statuses: ['refund_failed'] },
  { id: 'unpaid', label: 'NOT PAID YET', statuses: ['draft', 'submitted'] },
  { id: 'decided', label: 'DECIDED', statuses: ['approved', 'rejected', 'refunded'] },
] as const
export type Tab = (typeof TABS)[number]['id'] | 'reports' | 'invites' | 'waitlist'

export type Report = {
  id: string
  reporter_id: string | null
  reported_id: string | null
  reason: string | null
  status: 'open' | 'resolved' | 'hidden'
  created_at: string
  snapshot: {
    connection: { from_id: string; to_id: string; intent: string; note: string | null; status: string; created_at: string }
    reported: { id: string; name: string; role: string } | null
    messages: { from: string; body: string; at: string }[]
  }
}

export const STATUS_LABEL: Record<App['status'], string> = {
  draft: 'DRAFT',
  submitted: 'NOT PAID',
  paid: 'PAID',
  under_review: 'TO REVIEW',
  approved: 'APPROVED',
  rejected: 'REJECTED · REFUND PENDING',
  refunded: 'REJECTED · REFUNDED',
  refund_failed: 'REFUND FAILED',
}