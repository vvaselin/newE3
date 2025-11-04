import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LogoutButton from './LogoutButton'
import Link from 'next/link'
import { Button, Box, Heading, Divider } from '@chakra-ui/react' // ◀ Box, Heading, Divider をインポート
import OrderState from '../orderState/OrderState' // ◀ 注文状況コンポーネントをインポート

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

      <Button as={Link} href="/admin/menu" colorScheme="teal" mt={4} mr={4}>
        メニュー表示設定
      </Button>

      <LogoutButton />

      <Box mt={10}>
        <Heading size="lg">リアルタイム注文状況</Heading>
        <Divider my={4} />
        <OrderState />
      </Box>
    </div>
  )
}