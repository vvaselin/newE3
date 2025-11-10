'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box, Button, Grid, GridItem, Heading, Image, Text,
  VStack, HStack, Divider, Container, useToast,
} from '@chakra-ui/react';
import type { MenuItem } from './page';
import { createClient } from '@/utils/supabase/client'; 

interface CartItem extends MenuItem { quantity: number; }
interface MenuPageClientProps { menuItems: MenuItem[]; }

const CART_STORAGE_KEY = 'newE3_cart'; // カートだけ保存

export default function MenuPageClient({ menuItems }: MenuPageClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<{[key: string]: boolean}>({}); 
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const seatParam = (params as { seat?: string } | undefined)?.seat;
  const supabase = createClient(); // ◀ Supabaseクライアントを初期化

  const addToCart = async (item: MenuItem) => { 
    setLoadingItems(prev => ({ ...prev, [item.id]: true })); 

    try {
      // データベースに現在の 'display' 状態を問い合わせる
      const { data, error } = await supabase
        .from('foods')
        .select('display')
        .eq('id', item.id)
        .single();

      if (error || !data || data.display === false) {
        toast({
          title: '受付停止中',
          description: `「${item.name}」は現在注文を受け付けていません。`,
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
        setLoadingItems(prev => ({ ...prev, [item.id]: false })); 
        return; 
      }

      setCart((prev) => {
        const hit = prev.find((c) => c.id === item.id);
        return hit
          ? prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))
          : [...prev, { ...item, quantity: 1 }];
      });
      toast({ title: `${item.name}をカートに追加しました。`, status: 'success', duration: 1500, isClosable: true, position: 'top' });
    
    } catch (err) {
       toast({
          title: 'エラー',
          description: 'カートへの追加に失敗しました。',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
    } finally {
      setLoadingItems(prev => ({ ...prev, [item.id]: false })); 
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const hit = prev.find((c) => c.id === itemId);
      if (hit?.quantity === 1) return prev.filter((c) => c.id !== itemId);
      return prev.map((c) => (c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c));
    });
  };

  const total = () => cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleGoCheckout = () => {
    if (cart.length === 0) {
      toast({ title: 'カートが空です', status: 'warning', duration: 1200, isClosable: true, position: 'top' });
      return;
    }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    try {
      if (seatParam) {
        localStorage.setItem('newE3_seat', String(seatParam));
      }
    } catch {
      // ignore storage errors
    }
    router.push('/checkout');
  };

  return (
    <Container maxW="container.xl" py={10}>
      <HStack spacing={8} align="start">
        <Box flex="3">
          <Heading as="h1" mb={6}>メニュー</Heading>
          <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
            {menuItems.map((item) => (
              <GridItem key={item.id} borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
                <Image src={"../"+item.image} alt={item.name} w="100%" h="200px" objectFit="cover" />
                <Box p={4}>
                  <Text fontWeight="bold" fontSize="lg" noOfLines={1}>{item.name}</Text>
                  <Text mt={2} fontSize="xl" color="gray.800">¥{item.price.toLocaleString()}</Text>
                  {/* ▼ 
START MODIFICATION 
▼ */}
                  <Button 
                    mt={4} 
                    colorScheme="teal" 
                    onClick={() => addToCart(item)} 
                    w="full"
                    isLoading={loadingItems[item.id]} // ◀ ローディング状態を反映
                  >
                    カートに追加
                  </Button>
                  {/* ▲ 
END MODIFICATION 
▲ */}
                </Box>
              </GridItem>
            ))}
          </Grid>
        </Box>

        {/* 注文カートセクション */}
        <Box flex="1" p={6} borderWidth="1px" borderRadius="lg" position="sticky" top="2rem" boxShadow="md">
          <Heading as="h2" size="lg" mb={4}>
            注文カート
          </Heading>
          <Divider />
          {cart.length === 0 ? (
            <Text mt={4} color="gray.500">カートは空です。</Text>
          ) : (
            <>
              <VStack spacing={4} mt={4} align="stretch">
                {cart.map((item) => (
                  <HStack key={item.id} justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="bold">{item.name}</Text>
                      <Text fontSize="sm">¥{item.price.toLocaleString()}</Text>
                    </Box>
                    <HStack>
                      <Button size="sm" onClick={() => removeFromCart(item.id)}>-</Button>
                      <Text w="2rem" textAlign="center">{item.quantity}</Text>
                      <Button size="sm" onClick={() => addToCart(item)}>+</Button>
                    </HStack>
                  </HStack>
                ))}
              </VStack>
              <Divider my={4} />
              <HStack justify="space-between" mt={4}>
                <Text fontWeight="bold" fontSize="lg">合計金額</Text>
                <Text fontWeight="bold" fontSize="lg">¥{total().toLocaleString()}
                </Text>
              </HStack>
              <Button colorScheme="green" mt={6} w="full" size="lg" onClick={handleGoCheckout}>
                注文する（決済へ）
              </Button>
            </>
          )}
        </Box>
      </HStack>
    </Container>
  );
}