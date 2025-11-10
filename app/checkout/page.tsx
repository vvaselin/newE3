'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Button, Container, Divider, Heading, HStack, Text, VStack, Link as ChakraLink, Icon,
  Spinner // ◀ Spinner をインポート
} from '@chakra-ui/react';
import { FaYenSign, FaQrcode, FaCreditCard, FaMoneyBillWave, FaMobileAlt, FaTrain, FaWallet, FaCoins } from 'react-icons/fa';
import NextLink from 'next/link';
import { createClient } from '@/utils/supabase/client'; // ◀ Supabaseクライアントをインポート
import type { User } from '@supabase/supabase-js'; // ◀ User 型をインポート

type CartItem = { id: string; name: string; price: number; quantity: number; image?: string; };

const CART_STORAGE_KEY = 'newE3_cart';
const REMAINING_STORAGE_KEY = 'newE3_remaining';

export default function CheckoutPage() {
  const supabase = createClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [remaining, setRemaining] = useState<number>(0);

  const [points, setPoints] = useState<number>(0); // DBから取得するポイント
  const [currentUser, setCurrentUser] = useState<User | null>(null); // ログインユーザー
  const [isPointsLoading, setIsPointsLoading] = useState(true); // ポイント読み込み中フラグ
  
  const router = useRouter();
  const total = useMemo(() => cart.reduce((s, it) => s + it.price * it.quantity, 0), [cart]);
  const payAmount = useMemo(() => (remaining > 0 ? remaining : total), [remaining, total]);

  
  useEffect(() => {
    // 1. カートと残額をlocalStorageから読み込む (既存ロジック)
    try {
      const rawCart = localStorage.getItem(CART_STORAGE_KEY);
      setCart(rawCart ? JSON.parse(rawCart) : []);
      const rawRemain = localStorage.getItem(REMAINING_STORAGE_KEY);
      setRemaining(rawRemain ? Number(rawRemain) : 0);
    } catch {
      setCart([]);
      setRemaining(0);
    }

    
    const fetchUserAndPoints = async () => {
      setIsPointsLoading(true);
      // ユーザー取得
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCurrentUser(user); // ユーザー情報をセット
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('point')
          .eq('id', user.id)
          .single();
          
        if (profile && profile.point) {
          setPoints(profile.point);
        } else {
          setPoints(0); // エラーまたはプロファイルなし
        }
      } else {
        // 未ログイン
        setCurrentUser(null);
        setPoints(0);
      }
      setIsPointsLoading(false); // 読み込み完了
    };
    
    fetchUserAndPoints(); // 実行
    
  }, [supabase]); 

  const payMethods = [
    { name: '現金', href: '/checkout/cash', icon: FaMoneyBillWave, color: 'gray' },
    { name: 'QR決済', href: '/checkout/qrpayment', icon: FaQrcode, color: 'gray' },
    { name: 'クレジット', href: '/checkout/credit', icon: FaCreditCard, color: 'gray' },
    { name: '電子マネー', href: '/checkout/emoney', icon: FaMobileAlt, color: 'gray' },
    { name: '交通系IC', href: '/checkout/transit', icon: FaTrain, color: 'gray' },
    { name: 'ウォレット', href: '/checkout/wallet', icon: FaWallet, color: 'gray' },
  ];

  return (
    <Container maxW="container.lg" py={10}>
      {/* 注文サマリー (変更なし) */}
      <Box borderWidth="1px" borderRadius="lg" p={6}>
        {/* ... (省略) ... */}
        <VStack align="stretch" spacing={3} divider={<Divider />}>
          {cart.map((it) => (
            <HStack key={it.id} justify="space-between">
              <Box><Text fontWeight="bold">{it.name}</Text><Text fontSize="sm">数量 {it.quantity}</Text></Box>
              <Text fontWeight="bold">¥{(it.price * it.quantity).toLocaleString()}</Text>
            </HStack>
          ))}
          <HStack justify="space-between" pt={1}>
            <Text>カート合計</Text><Text fontWeight="bold">¥{total.toLocaleString()}</Text>
          </HStack>
          {remaining > 0 && (
            <HStack justify="space-between" pt={1} color="orange.600">
              <Text>ポイント支払い済み</Text><Text fontWeight="bold">- ¥{(total - remaining).toLocaleString()}</Text>
            </HStack>
          )}
          <Divider />
          <HStack justify="space-between" pt={1}>
            <Text fontWeight="bold" fontSize="xl">お支払い金額</Text>
            <Text fontWeight="bold" fontSize="xl" color="teal.500">
              ¥{payAmount.toLocaleString()}
            </Text>
          </HStack>
        </VStack>
      </Box>

      <Heading as="h2" size="lg" mt={10} mb={4}>お支払い方法</Heading>
      
      {/* ポイント支払いボタン */}
      <Box mb={4}>
        {/* ▼ 
START MODIFICATION 
▼ */}
        <Button
          as={NextLink}
          href="/checkout/points"
          leftIcon={<Icon as={FaCoins} />}
          colorScheme="teal" // ポイントなので目立たせる
          variant="solid"
          size="lg"
          height="60px"
          w="100%"
          // ログインしていない、または支払う金額が 0 の場合は無効化
          isDisabled={!currentUser || payAmount === 0}
          _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
          title={!currentUser ? 'ポイント利用にはログインが必要です' : (payAmount === 0 ? 'お支払い金額が0円です' : undefined)}
        >
          <HStack w="100%" justify="space-between">
            <Text>ポイントで支払う</Text>
            {isPointsLoading ? (
              <Spinner size="sm" /> // 読み込み中はスピナー
            ) : (
              <Text fontSize="sm" color="gray.100">
                所持: {points.toLocaleString()} 円
              </Text>
            )}
          </HStack>
        </Button>
        {!currentUser && (
          <Text fontSize="xs" color="gray.500" mt={1}>
            ログインするとポイントが利用できます。
          </Text>
        )}
        {/* ▲ 
END MODIFICATION 
▲ */}
      </Box>

      {/* その他の支払いボタン (変更なし) */}
      <VStack spacing={3} align="stretch">
        {payMethods.map((m) => (
          <Button
            key={m.name}
            as={NextLink}
            href={m.href}
            leftIcon={<Icon as={m.icon} />}
            colorScheme={m.color}
            variant="outline"
            size="lg"
            height="60px"
            w="100%"
            justifyContent="flex-start"
            isDisabled={payAmount === 0} // 支払い完了なら無効化
          >
            {m.name}
          </Button>
        ))}
      </VStack>
    </Container>
  );
}