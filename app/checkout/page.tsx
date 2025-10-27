'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Button, Container, Divider, Heading, HStack, VStack, Text, useToast, SimpleGrid, Badge,
} from '@chakra-ui/react';

type CartItem = { id: string; name: string; price: number; quantity: number; image?: string; };

const CART_STORAGE_KEY = 'newE3_cart';
const POINTS_STORAGE_KEY = 'newE3_points';     // 既存のポイント（円相当）を読むだけ
const REMAINING_STORAGE_KEY = 'newE3_remaining';

export default function CheckoutMethodPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ownedPoints, setOwnedPoints] = useState<number>(0);
  const [remainingHint, setRemainingHint] = useState<number | null>(null);

  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      setCart(raw ? JSON.parse(raw) : []);
    } catch { setCart([]); }

    const pts = Number(localStorage.getItem(POINTS_STORAGE_KEY));
    setOwnedPoints(Number.isFinite(pts) ? pts : 0); // 初期化しない

    const rem = Number(localStorage.getItem(REMAINING_STORAGE_KEY));
    setRemainingHint(Number.isFinite(rem) && rem > 0 ? rem : null);
  }, []);

  const total = useMemo(() => cart.reduce((s, it) => s + it.price * it.quantity, 0), [cart]);

  const gotoPoints = () => {
    if (cart.length === 0) {
      toast({ title: 'カートが空です', status: 'warning', duration: 1500, isClosable: true, position: 'top' });
      return;
    }
    router.push('/checkout/points');
  };

  const notImplemented = (label: string) =>
    toast({ title: `${label} は未実装`, description: '今回はポイント払いをご利用ください', status: 'info', duration: 1800, isClosable: true, position: 'top' });

  return (
    <Container maxW="container.lg" py={10}>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">決済方法の選択</Heading>
        <Button variant="ghost" onClick={() => router.push('/menu')}>メニューに戻る</Button>
      </HStack>

      <Box borderWidth="1px" borderRadius="lg" p={6}>
        <Heading as="h2" size="md" mb={3}>ご注文</Heading>
        {cart.length === 0 ? (
          <Text color="gray.500">カートが空です。メニューから商品を追加してください。</Text>
        ) : (
          <VStack align="stretch" spacing={3} divider={<Divider />}>
            {cart.map((it) => (
              <HStack key={it.id} justify="space-between">
                <Box><Text fontWeight="bold">{it.name}</Text><Text fontSize="sm">数量 {it.quantity}</Text></Box>
                <Text fontWeight="bold">¥{(it.price * it.quantity).toLocaleString()}</Text>
              </HStack>
            ))}
            <HStack justify="space-between" pt={1}>
              <Text>合計</Text><Text fontWeight="bold">¥{total.toLocaleString()}</Text>
            </HStack>
          </VStack>
        )}
        <HStack mt={3} spacing={3}>
          <Badge colorScheme="purple">所持ポイント：{ownedPoints.toLocaleString()} 円</Badge>
          {remainingHint !== null && <Badge colorScheme="orange">未決済の残額：¥{remainingHint.toLocaleString()}</Badge>}
        </HStack>
      </Box>

      <Box borderWidth="1px" borderRadius="lg" p={6} mt={6}>
        <Heading as="h2" size="md" mb={4}>支払い方法</Heading>
        <SimpleGrid columns={[1, 2]} spacing={4}>
          <Button size="lg" variant="outline" onClick={() => notImplemented('現金')}>現金支払い</Button>
          <Button size="lg" variant="outline" onClick={() => notImplemented('交通IC')}>交通IC系</Button>
          <Button size="lg" variant="outline" onClick={() => notImplemented('電子決済')}>電子決済</Button>
          <Button size="lg" colorScheme="teal" onClick={gotoPoints}>ポイント払いへ</Button>
        </SimpleGrid>
        <Text fontSize="sm" color="gray.500" mt={3}>※ 他方式は後で実装。今回はポイント払いのみ。</Text>
      </Box>
    </Container>
  );
}
