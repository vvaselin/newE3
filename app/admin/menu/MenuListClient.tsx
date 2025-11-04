'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client' // ◀ クライアント用を利用
import {
  Box,
  VStack,
  HStack,
  Text,
  Switch,
  useToast,
  Spinner,
} from '@chakra-ui/react'
import type { AdminMenuItem } from './page' // サーバーページから型をインポート

interface MenuListClientProps {
  initialItems: AdminMenuItem[]
}

export default function MenuListClient({ initialItems }: MenuListClientProps) {
  // サーバーから受け取った初期値をS tateで管理
  const [menuItems, setMenuItems] = useState(initialItems)
  // ローディング状態を項目ごとに管理
  const [loadingMap, setLoadingMap] = useState<{[key: string]: boolean}>({})
  
  const supabase = createClient()
  const toast = useToast()

  // トグル切り替え時の処理
  const handleToggle = async (id: string, newDisplayState: boolean) => {
    const itemIdStr = id.toString()
    
    // どの項目がロード中か分かるようにする
    setLoadingMap(prev => ({ ...prev, [itemIdStr]: true }))
    
    // データベースを更新
    const { error } = await supabase
      .from('foods')
      .update({ display: newDisplayState }) // 'display' カラムを更新
      .eq('id', id)

    // ローディング解除
    setLoadingMap(prev => ({ ...prev, [itemIdStr]: false }))

    if (error) {
      // エラーが発生した場合
      toast({
        title: '更新エラー',
        description: `「${menuItems.find(i => i.id === id)?.name}」の更新に失敗しました。`,
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } else {
      // 成功した場合、ローカルのS tate（画面表示）も更新
      setMenuItems(currentItems =>
        currentItems.map(item =>
          item.id === id ? { ...item, display: newDisplayState } : item
        )
      )
      toast({
        title: '更新しました',
        description: `「${menuItems.find(i => i.id === id)?.name}」を${newDisplayState ? "表示" : "非表示"}にしました。`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    }
  }

  return (
    <VStack align="stretch" spacing={3} maxW="container.md">
      {menuItems.map(item => {
        const isLoading = loadingMap[item.id.toString()]
        return (
          <HStack 
            key={item.id} 
            justify="space-between" 
            p={4} 
            borderWidth="1px" 
            borderRadius="md"
            // 更新中は少し薄くする
            opacity={isLoading ? 0.6 : 1}
            bg={item.display ? 'white' : 'gray.50'}
          >
            <Text fontWeight="medium" color={item.display ? 'gray.800' : 'gray.400'}>
              {item.name}
            </Text>
            <HStack>
              {isLoading && <Spinner size="sm" />}
              <Switch
                colorScheme="teal"
                isChecked={item.display}
                isDisabled={isLoading} // ロード中は無効化
                onChange={(e) => handleToggle(item.id, e.target.checked)}
              />
            </HStack>
          </HStack>
        )
      })}
    </VStack>
  )
}