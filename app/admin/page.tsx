import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LogoutButton from './LogoutButton'
import Link from 'next/link'
import { Button, Box } from '@chakra-ui/react'
import SimpleOrderList from './SimpleOrderList' // ◀ 新しいコンポーネントをインポート

// サーバーサイドで注文データを取得する関数
async function getOrders() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('seat_number, paid_at') // 必要なカラムのみ取得
    .order('seat_number', { ascending: true }) // 席番号順に取得

  if (error) {
    console.error('Error fetching orders for admin:', error.message)
    return []
  }
  return data || []
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // サーバーサイドで初期データを取得
  const initialOrders = await getOrders()

  return (
    <div style={{ padding: 40 }}>
      <h1>管理者ダッシュボード</h1>
      <p>ようこそ、 {user.email} さん</p>
      <p>ここは管理者専用ページです。</p>

      <Button as={Link} href="/admin/menu" colorScheme="teal" mt={4} mr={4}>
        メニュー表示設定
      </Button>

      <LogoutButton />

      {/* ▼ 
Order Status Section 
▼ */}
      <Box mt={10}>
        {/* SimpleOrderList を呼び出し、サーバーデータを渡す 
*/}
        <SimpleOrderList initialOrders={initialOrders} />
      </Box>
      {/* ▲ 
Order Status Section 
▲ */}
    </div>
  )
}