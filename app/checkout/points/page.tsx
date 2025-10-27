'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Button, Container, Divider, Heading, HStack, Input, Select, Text, VStack, useToast,
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
} from '@chakra-ui/react';

type CartItem = { id: string; name: string; price: number; quantity: number; image?: string; };

const CART_STORAGE_KEY = 'newE3_cart';
const POINTS_STORAGE_KEY = 'newE3_points';     // 既存ポイントを読むだけ
const REMAINING_STORAGE_KEY = 'newE3_remaining';

export default function CheckoutPointsPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ownedPoints, setOwnedPoints] = useState<number>(0); // 既存値（無ければ0）
  const [usePoints, setUsePoints] = useState<number>(0);

  const [isOpen, setIsOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      setCart(raw ? JSON.parse(raw) : []);
    } catch { setCart([]); }

    const pts = Number(localStorage.getItem(POINTS_STORAGE_KEY));
    setOwnedPoints(Number.isFinite(pts) ? pts : 0); // 初期化しない
  }, []);

  const total = useMemo(() => cart.reduce((s, it) => s + it.price * it.quantity, 0), [cart]);
  const maxUsable = useMemo(() => Math.min(ownedPoints, total), [ownedPoints, total]);
  const remain = useMemo(() => Math.max(0, total - usePoints), [total, usePoints]);
  const canPay = useMemo(() => usePoints > 0 && usePoints <= maxUsable, [usePoints, maxUsable]);

  const openConfirm = () => {
    if (!canPay) {
      toast({ title: '使用ポイントを確認してください', status: 'warning', duration: 1500, isClosable: true, position: 'top' });
      return;
    }
    setIsOpen(true);
  };

  const onConfirm = () => {
    const newOwned = ownedPoints - usePoints;
    localStorage.setItem(POINTS_STORAGE_KEY, String(newOwned)); // 差し引きのみ

    if (remain > 0) {
      // 残額あり：部分支払い（カート維持）
      localStorage.setItem(REMAINING_STORAGE_KEY, String(remain));
      setIsOpen(false);
      toast({
        title: 'ポイント支払い（部分）',
        description: `使用 ${usePoints.toLocaleString()} 円 / 残額 ¥${remain.toLocaleString()} を他方式でお支払いください`,
        status: 'success', duration: 2400, isClosable: true, position: 'top',
      });
      router.push('/checkout');
    } else {
      // 全額ポイント：完了 → カートクリア
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(REMAINING_STORAGE_KEY);
      setIsOpen(false);
      toast({
        title: 'ポイントで支払いました',
        description: `使用 ${usePoints.toLocaleString()} 円 / 残ポイント ${newOwned.toLocaleString()} 円`,
        status: 'success', duration: 2000, isClosable: true, position: 'top',
      });
      router.push('/');
    }
  };

  return (
    <Container maxW="container.lg" py={10}>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">決済（ポイント払い）</Heading>
        <Button variant="ghost" onClick={() => router.push('/checkout')}>決済方法へ戻る</Button>
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
      </Box>

      <Box borderWidth="1px" borderRadius="lg" p={6} mt={6}>
        <Heading as="h2" size="md" mb={3}>ポイント</Heading>
        <Text>
          所持ポイント（円相当）：<b>{ownedPoints.toLocaleString()}</b> 円（最大使用可：{maxUsable.toLocaleString()} 円）
        </Text>

        <HStack mt={3} spacing={3}>
          <Input
            type="number"
            inputMode="numeric"
            value={usePoints}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              setUsePoints(Math.max(0, Math.min(v, maxUsable)));
            }}
            placeholder="使用額を入力（例：500）"
          />
          <Select
            width="auto"
            onChange={(e) => {
              const v = Number(e.target.value);
              setUsePoints(Math.max(0, Math.min(v, maxUsable)));
            }}
            defaultValue=""
          >
            <option value="" disabled>クイック選択</option>
            <option value={Math.min(500, maxUsable)}>500円</option>
            <option value={Math.min(1000, maxUsable)}>1000円</option>
            <option value={maxUsable}>最大</option>
          </Select>
          <Button variant="outline" onClick={() => setUsePoints(maxUsable)}>最大</Button>
        </HStack>

        <HStack justify="space-between" mt={3}>
          <Text>ポイント使用後の残額</Text>
          <Text fontWeight="bold">¥{Math.max(0, total - usePoints).toLocaleString()}</Text>
        </HStack>

        <Button
          colorScheme="teal"
          size="lg"
          mt={5}
          w="full"
          onClick={openConfirm}
          isDisabled={!usePoints || !ownedPoints || !canPay || cart.length === 0}
          title={!ownedPoints ? 'ポイント残高がありません' : undefined}
        >
          ポイントで支払う（{usePoints.toLocaleString()} 円）
        </Button>
        <Button variant="ghost" mt={2} w="full" onClick={() => router.back()}>
          戻る
        </Button>
      </Box>

      {/* 確認ダイアログ */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={() => setIsOpen(false)}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>決済の確認</AlertDialogHeader>
            <AlertDialogBody>
              <VStack align="stretch" spacing={1}>
                <HStack justify="space-between"><Text>合計</Text><Text fontWeight="bold">¥{total.toLocaleString()}</Text></HStack>
                <HStack justify="space-between"><Text>使用ポイント</Text><Text fontWeight="bold">¥{usePoints.toLocaleString()}</Text></HStack>
                <Divider />
                <HStack justify="space-between">
                  <Text>支払い後の残額</Text>
                  <Text fontWeight="bold" color={Math.max(0, total - usePoints) > 0 ? 'orange.500' : 'green.500'}>
                    ¥{Math.max(0, total - usePoints).toLocaleString()}
                  </Text>
                </HStack>
              </VStack>
              <Text mt={2} fontSize="sm" color="gray.600">
                {Math.max(0, total - usePoints) > 0 ? '残額は他の方法でお支払いください。' : '全額ポイントでお支払いできます。'}
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsOpen(false)}>キャンセル</Button>
              <Button colorScheme="teal" onClick={onConfirm} ml={3}>実行する</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
}
