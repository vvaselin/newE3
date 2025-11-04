'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  Divider,
  Heading,
  HStack,
  Text,
  VStack,
  useToast,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';

type CartItem = { id: string; name: string; price: number; quantity: number; image?: string };

const CART_STORAGE_KEY = 'newE3_cart';
const REMAINING_STORAGE_KEY = 'newE3_remaining';

export default function QRPaymentPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [remaining, setRemaining] = useState<number>(0);

  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      setCart(raw ? (JSON.parse(raw) as CartItem[]) : []);
    } catch {
      setCart([]);
    }
    const rem = Number(localStorage.getItem(REMAINING_STORAGE_KEY));
    setRemaining(Number.isFinite(rem) && rem > 0 ? rem : 0);
  }, []);

  const total = useMemo(
    () => cart.reduce((s, it) => s + it.price * it.quantity, 0),
    [cart]
  );
  const chargeAmount = remaining > 0 ? remaining : total;
  const formatJPY = (n: number) => `¥${n.toLocaleString()}`;

  const complete = (ok: boolean) => {
    if (!chargeAmount) {
      toast({
        title: '決済対象がありません',
        description: '請求金額が0円です',
        status: 'info',
        duration: 1800,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    if (ok) {
      localStorage.removeItem(REMAINING_STORAGE_KEY);
      localStorage.removeItem(CART_STORAGE_KEY);
      toast({
        title: 'QR決済が完了しました',
        description: `お支払い金額：${formatJPY(chargeAmount)}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      router.push('/menu');
    } else {
      toast({
        title: 'QR決済に失敗しました',
        description: 'もう一度お試しください',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">QRコード決済</Heading>
        <Button variant="ghost" onClick={() => router.push('/checkout')}>
          決済方法に戻る
        </Button>
      </HStack>

      <Box borderWidth="1px" borderRadius="lg" p={6} mb={6}>
        <Heading as="h2" size="md" mb={3}>
          お支払い
        </Heading>
        <VStack align="stretch" spacing={3}>
          <Text>
            スマホの決済アプリで以下のQRを読み取り、金額をご確認の上お支払いください。
          </Text>

          {/* 実運用ではサーバ生成QR(PNG/SVG)に差し替え */}
          <Box
            aria-label="QRコード"
            role="img"
            borderWidth="1px"
            borderRadius="md"
            w="240px"
            h="240px"
            bg="repeating-conic-gradient(#000 0% 10%, #fff 10% 20%)"
            mx="auto"
          />

          <HStack justify="center" spacing={3}>
            {remaining > 0 && (
              <Badge colorScheme="orange">未決済の残額：{formatJPY(remaining)}</Badge>
            )}
            <Badge colorScheme="teal">今回の請求額：{formatJPY(chargeAmount)}</Badge>
          </HStack>
        </VStack>
      </Box>

      <Box borderWidth="1px" borderRadius="lg" p={6}>
        <Heading as="h2" size="md" mb={3}>
          支払い状態
        </Heading>
        <SimpleGrid columns={[1, 2]} spacing={4}>
          <Button size="lg" colorScheme="teal" onClick={() => complete(true)}>
            支払い完了
          </Button>
          <Button size="lg" variant="outline" onClick={() => complete(false)}>
            支払い失敗
          </Button>
        </SimpleGrid>
        <Text fontSize="sm" color="gray.500" mt={3}>
          ※ 本画面はモックです。実運用ではWebhook受信やポーリングで自動反映します。
        </Text>
      </Box>
    </Container>
  );
}
