'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Button,
  useToast,
  Tag,
  Spinner,
} from '@chakra-ui/react'

// サーバーから渡される注文データの型
type OrderRow = {
  seat_number: number | string
  paid_at: string
  cooking: boolean // ◀ 新しい 'cooking' カラム
}

export default function AdminOrderKanban({ initialOrders }: { initialOrders: OrderRow[] }) {
  // サーバーから受け取った初期データをS tateで管理
  const [orders, setOrders] = useState(initialOrders)
  // 個別のボタンローディング状態を管理
  const [loadingMap, setLoadingMap] = useState<{[key: string]: boolean}>({})
  // 全削除ボタンのローディング状態
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  
  const supabase = createClient()
  const toast = useToast()

  // Supabase Realtime で 'orders' テーブルの変更を購読
  useEffect(() => {
    const channel = supabase
      .channel('realtime-admin-kanban')
      .on<OrderRow>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // 新しい注文は 'cooking: true' で来る想定
            setOrders((prev) => [...prev, payload.new])
          } else if (payload.eventType === 'DELETE') {
            // 削除されたらローカルからも削除
            setOrders((prev) => {
              // payload.old may be undefined in some realtime payloads
              const oldSeat = payload.old?.seat_number
              if (oldSeat == null) return prev
              return prev.filter((o) => o.seat_number.toString() !== oldSeat.toString())
            })
          } else if (payload.eventType === 'UPDATE') {
            // "調理完了" で cooking が false になったら検知
            setOrders((prev) =>
              prev.map(o => o.seat_number.toString() === payload.new.seat_number.toString() ? payload.new : o)
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
  
  // 注文を「調理中」と「調理済み」に振り分ける
  const { cookingOrders, doneOrders } = useMemo(() => {
    const cooking: OrderRow[] = []
    const done: OrderRow[] = []
    
    orders.forEach(o => (o.cooking ? cooking.push(o) : done.push(o)))
    
    // それぞれを注文時間（古い順）でソート
    cooking.sort((a, b) => new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime())
    done.sort((a, b) => new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime())
    
    return { cookingOrders: cooking, doneOrders: done }
  }, [orders]) // orders S tateが変わるたびに再計算

  // 「調理完了」ボタンの処理 (cooking を false に更新)
  const handleMarkAsDone = async (seat_number: number | string) => {
    setLoadingMap(prev => ({...prev, [`mark_${seat_number}`]: true})) // ◀ キーを変更
    
    const { error } = await supabase
      .from('orders')
      .update({ cooking: false }) // ◀ cooking を false に
      .eq('seat_number', seat_number)
      
    setLoadingMap(prev => ({...prev, [`mark_${seat_number}`]: false})) // ◀ キーを変更

    if (error) {
      toast({ title: '更新エラー', description: error.message, status: 'error' })
    } else {
      toast({ title: `席 ${seat_number} を調理済みに移動しました`, status: 'success', duration: 1500 })
      setOrders(prev => 
        prev.map(o => 
          o.seat_number.toString() === seat_number.toString() 
            ? { ...o, cooking: false } 
            : o
        )
      )
    }
  }

  // 「提供完了（個別）」ボタンの処理 (特定の席を削除)
  const handleDeleteOneDone = async (seat_number: number | string) => {
    setLoadingMap(prev => ({...prev, [`del_${seat_number}`]: true})) // ◀ キーを変更
    
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('seat_number', seat_number)
      
    setLoadingMap(prev => ({...prev, [`del_${seat_number}`]: false})) // ◀ キーを変更

    if (error) {
      toast({ title: '削除エラー', description: error.message, status: 'error' })
    } else {
      toast({ title: `席 ${seat_number} を提供完了にしました`, status: 'info', duration: 1500 })
      setOrders(prev => 
        prev.filter(o => o.seat_number.toString() !== seat_number.toString())
      )
    }
  }
  
  // 「提供完了（一括）」ボタンの処理 (cooking が false のものを全削除)
  const handleDeleteAllDone = async () => {
     if (doneOrders.length === 0) return;
     
     setIsDeletingAll(true) // ◀ 変数名変更
     const { error } = await supabase
       .from('orders')
       .delete()
       .eq('cooking', false) // ◀ cooking: false のものだけ削除
       
     setIsDeletingAll(false) // ◀ 変数名変更
       
     if (error) {
        toast({ title: '一括削除エラー', description: error.message, status: 'error' })
     } else {
        toast({ title: `${doneOrders.length}件を提供完了にしました`, status: 'success', duration: 2000 })
        setOrders(prev => 
          prev.filter(o => o.cooking === true) 
        )
     }
  }

  return (
    <Box>
      <Heading size="lg" mb={4}>リアルタイム注文状況</Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
        
        {/* === 調理中カラム === */}
        <VStack align="stretch" spacing={3}>
          <Heading size="md" textAlign="center">
            調理中 ({cookingOrders.length}件)
          </Heading>
          <VStack align="stretch" spacing={2} p={2} bg="gray.50" borderRadius="md" minH="300px">
            {cookingOrders.map(order => (
              <HStack 
                key={order.seat_number.toString()} 
                justify="space-between" 
                bg="white" 
                p={3} 
                borderRadius="md" 
                shadow="sm"
              >
                <Tag size="lg" colorScheme="yellow" fontSize="xl">
                  席 {order.seat_number}
                </Tag>
                <Button 
                   size="sm" 
                   colorScheme="green"
                   onClick={() => handleMarkAsDone(order.seat_number)}
                   isLoading={loadingMap[`mark_${order.seat_number}`]} // ◀ キーを変更
                >
                  調理完了
                </Button>
              </HStack>
            ))}
            {cookingOrders.length === 0 && <Text color="gray.500" p={3}>注文はありません</Text>}
          </VStack>
        </VStack>
        
        {/* === 調理済みカラム === */}
        <VStack align="stretch" spacing={3}>
           <HStack justify="space-between" align="center" h="40px">
             <Heading size="md" textAlign="center">
               調理済み ({doneOrders.length}件)
             </Heading>
             <Button 
               size="sm" 
               colorScheme="red" 
               variant="solid"
               onClick={handleDeleteAllDone}
               isDisabled={doneOrders.length === 0}
               isLoading={isDeletingAll} // ◀ 変数名変更
             >
               提供完了 (一括削除)
             </Button>
           </HStack>
           <VStack align="stretch" spacing={2} p={2} bg="gray.50" borderRadius="md" minH="300px">
            {/* ▼ 
Modified 
▼ */}
            {doneOrders.map(order => (
              <HStack 
                key={order.seat_number.toString()} 
                justify="space-between" // ◀ 変更
                bg="white" 
                p={3} 
                borderRadius="md" 
                shadow="sm" 
                opacity={0.8}
              >
                <Tag size="lg" colorScheme="gray" fontSize="xl">
                  席 {order.seat_number}
                </Tag>
                {/* Add individual delete button 
 */}
                <Button
                  size="xs"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => handleDeleteOneDone(order.seat_number)}
                  isLoading={loadingMap[`del_${order.seat_number}`]} // ◀ キーを変更
                >
                  提供完了
                </Button>
              </HStack>
            ))}
            {/* ▲ 
Modified 
▲ */}
             {doneOrders.length === 0 && <Text color="gray.500" p={3}>調理済みの注文はありません</Text>}
           </VStack>
        </VStack>

      </SimpleGrid>
    </Box>
  )
}