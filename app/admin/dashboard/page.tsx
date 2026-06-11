import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export const metadata = { title: 'Admin — Submissions' }

export default async function AdminDashboardPage() {
  const store = await cookies()
  const session = store.get('admin_session')

  if (!session?.value || session.value !== process.env.ADMIN_PASSWORD) {
    redirect('/admin')
  }

  return <AdminDashboard />
}
