'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Button, Grid, GridItem, Heading, Image, Text,
  VStack, HStack, Divider, Container, useToast,
} from '@chakra-ui/react';
import type { MenuItem } from './page';

interface CartItem extends MenuItem { quantity: number; }
interface MenuPageClientProps { menuItems: MenuItem[]; }

const CART_STORAGE_KEY = 'newE3_cart'; // カートだけ保存

export default function MenuPageClient({ menuItems }: MenuPageClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const toast = useToast();
  const router = useRouter();

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const hit = prev.find((c) => c.id === item.id);
      return hit
        ? prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))
        : [...prev, { ...item, quantity: 1 }];
    });
    toast({ title: `${item.name}をカートに追加しました。`, status: 'success', duration: 1500, isClosable: true, position: 'top' });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const hit = prev.find((c) => c.id === itemId);
      if (hit?.quantity === 1) return prev.filter((c) => c.id !== itemId);
      return prev.map((c) => (c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c));
    });
  };

  const total = () => cart.reduce((s, i) => s + i.price * i.quantity, 0);

  // ★遷移のみ（ポイントに触れない）
  const handleGoCheckout = () => {
    if (cart.length === 0) {
      toast({ title: 'カートが空です', status: 'warning', duration: 1200, isClosable: true, position: 'top' });
      return;
    }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); // カート保存
    router.push('/checkout'); // 決済方法選択へ
  };

  return (
    <Container maxW="container.xl" py={10}>
      <HStack spacing={8} align="start">
        <Box flex="3">
          <Heading as="h1" mb={6}>メニュー</Heading>
          <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
            {menuItems.map((item) => (
              <GridItem key={item.id} borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
                <Image src={item.image} alt={item.name} w="100%" h="200px" objectFit="cover" />
                <Box p={4}>
                  <Text fontWeight="bold" fontSize="lg" noOfLines={1}>{item.name}</Text>
                  <Text mt={2} fontSize="xl" color="gray.800">¥{item.price.toLocaleString()}</Text>
                  
                </Box>
              </GridItem>
            ))}
          </Grid>
        </Box>

        
      </HStack>
    </Container>
  );
}
