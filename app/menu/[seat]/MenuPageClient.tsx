'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  GridItem,
  Heading,
  Image,
  Text,
  VStack,
  HStack,
  Divider,
  Container,
  useToast, 
} from '@chakra-ui/react';
import type { MenuItem } from './page'; 

interface CartItem extends MenuItem {
  quantity: number;
}

interface MenuPageClientProps {
  menuItems: MenuItem[];
}

export default function MenuPageClient({ menuItems }: MenuPageClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const toast = useToast();

  // カートに商品を追加する関数
  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });

    // ユーザーに通知
    toast({
      title: `${item.name}をカートに追加しました。`,
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top',
    });
  };

  // カートから商品を1つ減らす関数
  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === itemId);
      if (existingItem?.quantity === 1) {
        // 数量が1の場合はカートから削除
        return prevCart.filter((cartItem) => cartItem.id !== itemId);
      } else {
        // 数量を1減らす
        return prevCart.map((cartItem) =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
    });
  };

  // 合計金額を計算する関数
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <Container maxW="container.xl" py={10}>
      <HStack spacing={8} align="start">
        {/* メニュー一覧セクション */}
        <Box flex="3">
          <Heading as="h1" mb={6}>
            メニュー
          </Heading>
          <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
            {menuItems.map((item) => (
              <GridItem key={item.id} borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
                <Image src={"../"+item.image} alt={item.name} w="100%" h="200px" objectFit="cover" />
                <Box p={4}>
                  <Text fontWeight="bold" fontSize="lg" noOfLines={1}>{item.name}</Text>
                  <Text mt={2} fontSize="xl" color="gray.800">¥{item.price.toLocaleString()}</Text>
                  <Button mt={4} colorScheme="teal" onClick={() => addToCart(item)} w="full">
                    カートに追加
                  </Button>
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
                <Text fontWeight="bold" fontSize="lg">¥{calculateTotal().toLocaleString()}</Text>
              </HStack>
              <Button colorScheme="green" mt={6} w="full" size="lg">
                注文する
              </Button>
            </>
          )}
        </Box>
      </HStack>
    </Container>
  );
}
