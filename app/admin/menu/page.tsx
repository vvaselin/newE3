import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MenuListClient from './MenuListClient'
import Link from 'next/link'
import { Box, Heading, Text, Button } from '@chakra-ui/react' // Chakra UI を利用

// 管理ページ用の型定義
export type AdminMenuItem = {
  id: string; // IDは文字列型 (CSVから推測)
  name: string;
  display: boolean;
}

// DBから全メニューを取得する関数 (displayがtrue/false問わず)
async function getAllMenuItems(): Promise<AdminMenuItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('foods')
    .select('id, name, display') // 必要なカラムのみ取得
    .order('id', { ascending: true })

  if (error) {
    console.error('Error fetching admin menu items:', error)
    return []
  }
  // dataがnullの場合も空配列を返す
  return (data as AdminMenuItem[]) || []
}

export default async function AdminMenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ログインしていない場合はリダイレクト
  if (!user) {
    redirect('/login')
  }

  // サーバーサイドで全メニュー項目を取得
  const menuItems = await getAllMenuItems()

  return (
    <Box p={8}>
      <Button as={Link} href="/admin" variant="link" mb={4}>
        ← 管理者ダッシュボードに戻る
      </Button>
      <Heading size="lg" mb={6}>メニュー表示設定</Heading>
      
      {/* クライアントコンポーネントにデータを渡す 
*/}
      <MenuListClient initialItems={menuItems} />
    </Box>
  )
}