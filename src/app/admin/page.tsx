import type { Metadata } from 'next'
import AdminClient from '@/admin/AdminClient'

export const metadata: Metadata = {
  title: 'Review queue',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminClient />
}
