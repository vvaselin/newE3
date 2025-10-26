import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LogoutButton from './LogoutButton'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>管理者ダッシュボード</h1>
      <p>ようこそ、 {user.email} さん</p>
      <p>ここは管理者専用ページです。</p>
      <LogoutButton />
    </div>
  )
}