import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PasswordGate } from '@/components/admin/PasswordGate'

export const metadata = { title: 'Admin' }

export default async function AdminPage() {
  const store = await cookies()
  const session = store.get('admin_session')

  if (session?.value && session.value === process.env.ADMIN_PASSWORD) {
    redirect('/admin/dashboard')
  }

  return <PasswordGate />
}
