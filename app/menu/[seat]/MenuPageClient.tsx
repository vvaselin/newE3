'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box, Button, Grid, GridItem, Heading, Image, Text,
  VStack, HStack, Divider, Container, useToast,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Badge,
} from '@chakra-ui/react';
import type { MenuItem } from './page';
import { createClient } from '@/utils/supabase/client'; 

interface CartItem extends MenuItem { quantity: number; }
interface MenuPageClientProps { menuItems: MenuItem[]; }

const CART_STORAGE_KEY = 'newE3_cart'; // カートだけ保存

// 指定トークン → ラベル/並び順
const TOKEN_TO_CATEGORY: Array<{ token: string; label: string; sort: number }> = [
  { token: '_Main-dish',              label: '主菜',         sort: 1 },
  { token: '_Side-dishes-and-salads', label: '副菜・サラダ', sort: 2 },
  { token: '_Rice-bowls-and-curry',   label: '丼物・カレー', sort: 3 },
  { token: '_noodles',                label: '麵類',         sort: 4 },
  { token: '_rice',                   label: 'ごはん',       sort: 5 },
  { token: '_Soup',                   label: '汁物',         sort: 6 },
  { token: '_dessert',                label: 'デザート',     sort: 7 },
];

// 画像名の保険（genre が無い/一致しない場合）
const IMAGE_PATTERNS: Array<{ re: RegExp; label: string; sort: number }> = [
  { re: /Main-dish/i,               label: '主菜',         sort: 1 },
  { re: /Side-dishes-and-salads/i,  label: '副菜・サラダ', sort: 2 },
  { re: /Rice-bowls-and-curry/i,    label: '丼物・カレー', sort: 3 },
  { re: /noodles/i,                 label: '麵類',         sort: 4 },
  { re: /_rice/i,                   label: 'ごはん',       sort: 5 },
  { re: /Soup/i,                    label: '汁物',         sort: 6 },
  { re: /dessert/i,                 label: 'デザート',     sort: 7 },
];

function pickCategory(item: MenuItem): { label: string; sort: number } {
  const g = (item.genre ?? '').toString();
  if (g) {
    const lower = g.toLowerCase();
    const hit = TOKEN_TO_CATEGORY.find(({ token }) => lower.includes(token.toLowerCase()));
    if (hit) return { label: hit.label, sort: hit.sort };
  }
  // 画像名から推定
  const img = (item.image ?? '').toString();
  for (const p of IMAGE_PATTERNS) {
    if (p.re.test(img)) return { label: p.label, sort: p.sort };
  }
  return { label: 'その他', sort: 999 };
}

export default function MenuPageClient({ menuItems }: MenuPageClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<{[key: string]: boolean}>({}); 
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const seatParam = (params as { seat?: string } | undefined)?.seat;
  const supabase = createClient(); // ◀ Supabaseクライアントを初期化

// ★カテゴリ別にグループ化（並び順もここで）
  const grouped = useMemo(() => {
    const map = new Map<string, { sort: number; items: MenuItem[] }>();
    for (const it of menuItems) {
      const { label, sort } = pickCategory(it);
      if (!map.has(label)) map.set(label, { sort, items: [] });
      map.get(label)!.items.push(it);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[1].sort - b[1].sort)
      .map(([category, { sort, items }]) => ({ category, sort, items }));
  }, [menuItems]);

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

  const handleGoCheckout = () => {
    if (cart.length === 0) {
      toast({ title: 'カートが空です', status: 'warning', duration: 1200, isClosable: true, position: 'top' });
      return;
    }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    try {
      if (seatParam) {
        localStorage.setItem('newE3_seat', String(seatParam));
      }
    } catch {
      // ignore storage errors
    }
    router.push('/checkout');
  };

  return (
    <Container maxW="container.xl" py={10}>
      <HStack spacing={8} align="start">
        <Box flex="3">
          <Heading as="h1" mb={6}>メニュー</Heading>
{/* 追加：アコーディオンでカテゴリごとに表示 */}
          <Accordion allowMultiple defaultIndex={[0]}>
            {grouped.map(({ category, items }) => (
              <AccordionItem key={category} border="1px solid" borderColor="blackAlpha.100" rounded="lg" mb={3}>
                <h2>
                  <AccordionButton _expanded={{ bg: 'gray.50' }} px={4} py={3}>
                    <Box as="span" flex="1" textAlign="left" fontWeight="bold">
                      {category} <Badge ml={2}>{items.length}</Badge>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pt={4} pb={6}>
                  {/* ★元のGrid構造はそのまま。配列だけ category 内の items に差し替え★ */}
                  <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
                    {items.map((item) => (
                      <GridItem key={item.id} borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
                        {/* seat配下なので既存仕様どおり ../ を付与 */}
                        <Image src={'../' + item.image} alt={item.name} w="100%" h="200px" objectFit="cover" />
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
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Box>

        {/* 注文カートセクション（元のまま） */}
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
                <Text fontWeight="bold" fontSize="lg">¥{total().toLocaleString()}</Text>
              </HStack>
              <Button colorScheme="green" mt={6} w="full" size="lg" onClick={handleGoCheckout}>
                注文する（決済へ）
              </Button>
            </>
          )}
        </Box>
      </HStack>
    </Container>
  );
}