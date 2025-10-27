'use client'

import { useEffect, useState } from 'react'
import { Box, Button, Flex, Spacer, Text, useToast } from '@chakra-ui/react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const toast = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    // URLクエリから 'auth_error' を取得
    const authError = searchParams.get('auth_error')

    if (authError) {
      // auth_error=true があればトーストを表示
      toast({
        title: 'アクセスが拒否されました',
        description: '管理者権限がありません。',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      })
      
      // トースト表示後、URLからクエリパラメータを削除
      // (リロードしても再表示されないようにする)
      const newUrl = window.location.pathname
      window.history.replaceState(null, '', newUrl)
    }
  }, [searchParams, toast]) // ページ読み込み時（searchParams変更時）に実行

  useEffect(() => {
    // ページ読み込み時に現在のユーザーを取得
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    fetchUser()

    // 認証状態の変更（ログイン・ログアウト時）を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // コンポーネントが不要になったら監視を解除
    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase.auth])

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/') // トップページに戻る
    router.refresh()
  }

  return (
    <Box 
      as="header" 
      p={4} 
      bg="gray.100"
      position="fixed" // 画面上部に固定
      top="0"
      left="0"
      right="0"
      zIndex="banner" // 他の要素より手前に表示
      boxShadow="sm"
    >
      <Flex align="center" maxW="container.xl" mx="auto">
        {/* 左側: トップへのリンク */}
        <Box>
           <Link href="/">
             <Text fontWeight="bold">茨城大学日立食堂</Text>
           </Link>
        </Box>

        <Spacer /> {/* これが要素を左右に押し広げます */}

        {/* 右側: 認証ボタンエリア */}
        <Box>
          {loading ? (
            <Text fontSize="sm">読み込み中...</Text>
          ) : user ? (
            // ログイン済みの状態
            <Flex gap={3} align="center">
              <Text fontSize="sm" display={{ base: 'none', md: 'block' }}>
                {user.email}
              </Text>
              <Button as={Link} href="/admin" colorScheme="teal" size="sm">
                管理者ページへ
              </Button>
              <Button onClick={handleLogout} colorScheme="gray" size="sm">
                ログアウト
              </Button>
            </Flex>
          ) : (
            // 未ログインの状態
            <Button as={Link} href="/login" colorScheme="blue" size="sm">
              管理者ログイン
            </Button>
          )}
        </Box>
      </Flex>
    </Box>
  )
}