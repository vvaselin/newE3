'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      style={{ padding: '10px 15px', background: '#dc3545', color: 'white', border: 'none', cursor: 'pointer', marginTop: 20 }}
    >
      ログアウト
    </button>
  )
}