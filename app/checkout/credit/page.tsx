'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Button, Container, Divider, FormControl, FormLabel, Heading, HStack, Input, Text, VStack, useToast, Badge,
} from '@chakra-ui/react';

type CartItem = { id: string; name: string; price: number; quantity: number; image?: string; };

const CART_STORAGE_KEY = 'newE3_cart';
const REMAINING_STORAGE_KEY = 'newE3_remaining';

export default function CreditPayPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [remaining, setRemaining] = useState<number>(0);

  // フォーム
  const [cardNumber, setCardNumber] = useState('');
  const [exp, setExp] = useState('');   // MM/YY
  const [cvc, setCvc] = useState('');
  const [holder, setHolder] = useState('');

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

  const validate = () => {
    const digits = cardNumber.replace(/\s|-/g, '');
    if (!/^\d{13,19}$/.test(digits)) return 'カード番号を正しく入力してください';
    if (!/^\d{2}\/\d{2}$/.test(exp)) return '有効期限は MM/YY 形式で入力してください';
    const [mm] = exp.split('/').map((v) => parseInt(v, 10));
    if (mm < 1 || mm > 12) return '有効期限（月）が不正です';
    if (!/^\d{3,4}$/.test(cvc)) return 'CVCを正しく入力してください';
    if (!holder.trim()) return 'カード名義を入力してください';
    if (chargeAmount <= 0) return '請求金額が0円のため決済は不要です';
    if (cart.length === 0 && remaining === 0) return 'カートが空です';
    return null;
  };

  const handlePay = () => {
    const err = validate();
    if (err) {
      toast({ title: '入力エラー', description: err, status: 'warning', duration: 2000, isClosable: true, position: 'top' });
      return;
    }

    // 実処理の代わりにモック成功
    localStorage.removeItem(REMAINING_STORAGE_KEY);
    localStorage.removeItem(CART_STORAGE_KEY);

    toast({
      title: 'クレジット決済が完了しました',
      description: `お支払い金額：${formatJPY(chargeAmount)}`,
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top',
    });

    router.push('/menu');
  };

  return (
    <Container maxW="container.md" py={10}>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">クレジット払い</Heading>
        <Button variant="ghost" onClick={() => router.push('/checkout')}>決済方法に戻る</Button>
      </HStack>

      <Box borderWidth="1px" borderRadius="lg" p={6} mb={6}>
        <Heading as="h2" size="md" mb={3}>ご注文</Heading>
        {cart.length === 0 ? (
          remaining > 0 ? (
            <Text>ポイント処理後の未決済残額があります。</Text>
          ) : (
            <Text color="gray.500">カートが空です。</Text>
          )
        ) : (
          <VStack align="stretch" spacing={3} divider={<Divider />}>
            {cart.map((it) => (
              <HStack key={it.id} justify="space-between">
                <Box>
                  <Text fontWeight="bold">{it.name}</Text>
                  <Text fontSize="sm">数量 {it.quantity}</Text>
                </Box>
                <Text fontWeight="bold">¥{(it.price * it.quantity).toLocaleString()}</Text>
              </HStack>
            ))}
            <HStack justify="space-between" pt={1}>
              <Text>合計</Text><Text fontWeight="bold">¥{total.toLocaleString()}</Text>
            </HStack>
          </VStack>
        )}

        <HStack mt={3} spacing={3}>
          {remaining > 0 && <Badge colorScheme="orange">未決済の残額：{formatJPY(remaining)}</Badge>}
          <Badge colorScheme="blue">今回の請求額：{formatJPY(chargeAmount)}</Badge>
        </HStack>
      </Box>

      <Box borderWidth="1px" borderRadius="lg" p={6}>
        <Heading as="h2" size="md" mb={4}>カード情報</Heading>

        <VStack align="stretch" spacing={4}>
          <FormControl>
            <FormLabel>カード番号</FormLabel>
            <Input
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              inputMode="numeric"
              autoComplete="cc-number"
            />
          </FormControl>

          <HStack spacing={4}>
            <FormControl>
              <FormLabel>有効期限 (MM/YY)</FormLabel>
              <Input
                placeholder="12/29"
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={5}
              />
            </FormControl>
            <FormControl>
              <FormLabel>CVC</FormLabel>
              <Input
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
              />
            </FormControl>
          </HStack>

          <FormControl>
            <FormLabel>カード名義（半角英字）</FormLabel>
            <Input
              placeholder="TARO IBARAKI"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              autoComplete="cc-name"
            />
          </FormControl>

          <Divider />

          <Button size="lg" colorScheme="blue" onClick={handlePay}>
            {`¥${chargeAmount.toLocaleString()} を支払う`}
          </Button>
        </VStack>
      </Box>
    </Container>
  );
}
