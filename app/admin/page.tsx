import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LogoutButton from './LogoutButton'
import Link from 'next/link'
import { Button, Box } from '@chakra-ui/react'
// import SimpleOrderList from './SimpleOrderList' // ◀ 削除
import AdminOrderKanban from './AdminOrderKanban' // ◀ 新しいコンポーネントをインポート

// サーバーサイドで注文データを取得する関数
async function getOrders() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('seat_number, paid_at, cooking') // ◀ 'cooking' カラムを追加
    .order('paid_at', { ascending: true }) // 注文時間順に取得

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

      <Button as={Link} href="/admin/contacts" colorScheme="teal" mt={4} mr={4} mx={10}>
        お問い合わせ内容確認
      </Button>

      <LogoutButton />

      {/* ▼ 
Order Status Section 
▼ */}
      <Box mt={10}>
        {/* AdminOrderKanban を呼び出し、サーバーデータを渡す 
*/}
        <AdminOrderKanban initialOrders={initialOrders} />
      </Box>
      {/* ▲ 
Order Status Section 
▲ */}
    </div>
  )
}