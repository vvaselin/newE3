'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Wrap,
  WrapItem,
  Tag,
  Divider,
} from '@chakra-ui/react'

// サーバーから渡される注文データの型
type OrderRow = {
  seat_number: number | string
  paid_at: string
}

export default function SimpleOrderList({ initialOrders }: { initialOrders: OrderRow[] }) {
  // サーバーから受け取った初期データをS tateで管理
  const [orders, setOrders] = useState(initialOrders)
  const supabase = createClient()

  // Supabase Realtime で 'orders' テーブルの変更を購読
  useEffect(() => {
    // 席番号順にソートするヘルパー関数
    const sortOrders = (o: OrderRow[]) => 
      o.sort((a, b) => Number(a.seat_number) - Number(b.seat_number));

    const channel = supabase
      .channel('realtime-admin-simple-orders')
      .on<OrderRow>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          // 変更があったらローカルのS tateを更新
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => sortOrders([...prev, payload.new]))
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => 
              sortOrders(prev.filter((o) => 
                payload.old && payload.old.seat_number && o.seat_number.toString() !== payload.old.seat_number.toString()
              ))
            )
          }
        }
      )
      .subscribe()

    // コンポーネントがアンマウントされたら購読を解除
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])
  
  // 表示前に席番号でソート
  const sortedOrders = orders.sort((a, b) => Number(a.seat_number) - Number(b.seat_number));

  return (
    <Box>
      <Heading size="lg" mb={4}>リアルタイム注文一覧</Heading>
      <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
        {sortedOrders.length === 0 ? (
          <Text color="gray.500">現在、注文はありません。</Text>
        ) : (
          <Wrap spacing={3}>
            {sortedOrders.map((order) => (
              <WrapItem key={order.seat_number.toString()}>
                <Tag size="lg" variant="solid" colorScheme="teal" p={3}>
                  席 {order.seat_number}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        )}
      </Box>
    </Box>
  )
}