'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, Divider, Heading, HStack, Text, VStack, useToast, Badge } from '@chakra-ui/react';

type CartItem = { id: string; name: string; price: number; quantity: number; image?: string; };

const CART_STORAGE_KEY = 'newE3_cart';
const REMAINING_STORAGE_KEY = 'newE3_remaining';

export default function WalletPage() {
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

  const pay = async () => {
    // 実運用では Payment Request API / Stripe の起動を想定
    localStorage.removeItem(REMAINING_STORAGE_KEY);
    localStorage.removeItem(CART_STORAGE_KEY);
    toast({ title: 'ウォレット決済が完了しました', description: `お支払い金額：${formatJPY(chargeAmount)}`, status: 'success', duration: 2000, isClosable: true, position: 'top' });
    router.push('/menu');
  };

  return (
    <Container maxW="container.sm" py={10}>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">ウォレット決済（モック）</Heading>
        <Button variant="ghost" onClick={() => router.push('/checkout')}>決済方法に戻る</Button>
      </HStack>

      <Box borderWidth="1px" borderRadius="lg" p={6}>
        <Heading as="h2" size="md" mb={3}>Apple Pay / Google Pay 風</Heading>
        <VStack align="stretch" spacing={3}>
          <Text>端末に保存されているカード情報でワンタップ決済（モック）。</Text>
          <HStack justify="center" spacing={3}>
            {remaining > 0 && <Badge colorScheme="orange">未決済の残額：{formatJPY(remaining)}</Badge>}
            <Badge colorScheme="blackAlpha">お支払い金額：{formatJPY(chargeAmount)}</Badge>
          </HStack>
          <Divider />
          <Button size="lg" colorScheme="blackAlpha" onClick={pay}>ウォレットで支払う</Button>
          <Text fontSize="sm" color="gray.500">※ 対応ブラウザでは Payment Request API を利用可能。</Text>
        </VStack>
      </Box>
    </Container>
  );
}
