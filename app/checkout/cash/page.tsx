'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, Divider, Heading, HStack, Text, VStack, useToast, Badge, Code } from '@chakra-ui/react';

type CartItem = { id: string; name: string; price: number; quantity: number; image?: string; };

const CART_STORAGE_KEY = 'newE3_cart';
const REMAINING_STORAGE_KEY = 'newE3_remaining';

const genOrderNo = () => 'C' + new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

export default function CashPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [remaining, setRemaining] = useState<number>(0);
  const [orderNo] = useState<string>(genOrderNo());

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

  const markPaid = async () => {
    // 登録: localStorage から座席を読み取り、サーバーに登録
    let seatRaw = null;
    try { seatRaw = localStorage.getItem('newE3_seat'); } catch {}
    if (!seatRaw) {
      toast({ title: '座席情報が見つかりませんでした', status: 'error', duration: 3000 });
      return;
    }
    const seatNumber = Number(seatRaw);
    if (!Number.isInteger(seatNumber) || seatNumber < 1) {
      toast({ title: '座席番号が不正です', status: 'error', duration: 3000 });
      return;
    }

    try {
      const resp = await fetch('/api/orders/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seatNumber }),
      });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok || j.error) {
        console.error('orders register failed', j);
        toast({ title: '注文登録に失敗しました', description: j?.error ?? 'unknown', status: 'error', duration: 4000 });
        return;
      }
    } catch (err) {
      console.error('orders register error', err);
      toast({ title: '注文登録に失敗しました', status: 'error', duration: 4000 });
      return;
    }

    localStorage.removeItem(REMAINING_STORAGE_KEY);
    localStorage.removeItem(CART_STORAGE_KEY);
    toast({ title: '現金受領済みとして確定しました', description: `受領額：${formatJPY(chargeAmount)}`, status: 'success', duration: 2000, isClosable: true, position: 'top' });
    router.push('/orderState');
  };

  return (
    <Container maxW="container.sm" py={10}>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">現金支払い</Heading>
        <Button variant="ghost" onClick={() => router.push('/checkout')}>決済方法に戻る</Button>
      </HStack>

      <Box borderWidth="1px" borderRadius="lg" p={6}>
        <Heading as="h2" size="md" mb={3}>レジでお支払い</Heading>
        <VStack align="stretch" spacing={3}>
          <Text>以下の注文番号をスタッフにお見せください。レジにて現金でお支払い後、スタッフ操作で「受領済」にします。</Text>
          <Box borderWidth="1px" borderRadius="lg" p={4} textAlign="center" bg="gray.50">
            <Text fontSize="sm" color="gray.500">注文番号</Text>
            <Code fontSize="2xl" p={2}>{orderNo}</Code>
          </Box>
          <HStack justify="center" spacing={3}>
            {remaining > 0 && <Badge colorScheme="orange">未決済の残額：{formatJPY(remaining)}</Badge>}
            <Badge colorScheme="purple">お支払い金額：{formatJPY(chargeAmount)}</Badge>
          </HStack>
          <Divider />
          <Button colorScheme="purple" onClick={markPaid}>（モック）現金受領済みにする</Button>
          <Text fontSize="sm" color="gray.500">※ 実運用ではスタッフ画面から受領処理を行います。</Text>
        </VStack>
      </Box>
    </Container>
  );
}
