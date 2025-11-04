'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, Divider, Heading, HStack, Text, VStack, useToast, Badge } from '@chakra-ui/react';

type CartItem = { id: string; name: string; price: number; quantity: number; image?: string; };

const CART_STORAGE_KEY = 'newE3_cart';
const REMAINING_STORAGE_KEY = 'newE3_remaining';

export default function TransitPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [remaining, setRemaining] = useState<number>(0);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      setCart(raw ? JSON.parse(raw) as CartItem[] : []);
    } catch { setCart([]); }

    const rem = Number(localStorage.getItem(REMAINING_STORAGE_KEY));
    setRemaining(Number.isFinite(rem) && rem > 0 ? rem : 0);
  }, []);

  const total = useMemo(() => cart.reduce((s, it) => s + it.price * it.quantity, 0), [cart]);
  const chargeAmount = remaining > 0 ? remaining : total;
  const formatJPY = (n: number) => `¥${n.toLocaleString()}`;

  const tap = () => {
    localStorage.removeItem(REMAINING_STORAGE_KEY);
    localStorage.removeItem(CART_STORAGE_KEY);
    toast({ title: '交通ICでの支払いが完了しました', description: `お支払い金額：${formatJPY(chargeAmount)}`, status: 'success', duration: 2000, isClosable: true, position: 'top' });
    router.push('/menu');
  };

  return (
    <Container maxW="container.sm" py={10}>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">交通IC決済</Heading>
        <Button variant="ghost" onClick={() => router.push('/checkout')}>決済方法に戻る</Button>
      </HStack>

      <Box borderWidth="1px" borderRadius="lg" p={6}>
        <Heading as="h2" size="md" mb={3}>カードをタッチ</Heading>
        <VStack align="stretch" spacing={3}>
          <Text>リーダーに交通系ICカードをタッチしてください。（モック）</Text>
          <Box h="160px" borderWidth="2px" borderStyle="dashed" borderRadius="lg" display="grid" placeItems="center" bg="gray.50">
            <Text color="gray.500">NFC リーダー領域（モック）</Text>
          </Box>
          <HStack justify="center" spacing={3}>
            {remaining > 0 && <Badge colorScheme="orange">未決済の残額：{formatJPY(remaining)}</Badge>}
            <Badge colorScheme="green">お支払い金額：{formatJPY(chargeAmount)}</Badge>
          </HStack>
          <Divider />
          <Button colorScheme="green" onClick={tap}>（モック）タッチして支払う</Button>
          <Text fontSize="sm" color="gray.500">※ 実運用では端末SDKと連携します。</Text>
        </VStack>
      </Box>
    </Container>
  );
}
