'use client';

import { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box, Button, Grid, GridItem, Heading, Image, Text,
  VStack, HStack, Divider, Container, useToast,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Badge,
} from '@chakra-ui/react';
import type { MenuItem as BaseMenuItem } from './page';

// Supabaseから来る genre をこのファイル内でだけ拡張して受け取る
type MenuItem = BaseMenuItem & { genre?: string | null };

interface CartItem extends MenuItem { quantity: number; }
interface MenuPageClientProps { menuItems: MenuItem[]; }

const CART_STORAGE_KEY = 'newE3_cart';

// 英語/表記ゆれ → 日本語ラベル
const GENRE_LABELS: Record<string, string> = {
  'main-dish': '主菜',
  'maindish': '主菜',
  'side-dishes-and-salads': '副菜・サラダ',
  'rice-bowls-and-curry': '丼物・カレー',
  'noodles': '麺類',
  'rice': 'ごはん',
  'soup': '汁物',
  'dessert': 'デザート',
};

// 表示順（ここにないものは最後に五十音順）
const GENRE_ORDER = ['主菜', '副菜・サラダ', '丼物・カレー', '麺類', 'ごはん', '汁物', 'デザート', 'その他'];

function toJapaneseGenreLabel(raw?: string | null): string {
  if (!raw) return 'その他';
  const key = raw.toString().trim().toLowerCase().replace(/[_\s]+/g, '-');
  return GENRE_LABELS[key] ?? raw; // 既に日本語なら生かす
}

export default function MenuPageClient({ menuItems }: MenuPageClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const seatParam = (params as { seat?: string } | undefined)?.seat;

  // ★ Supabaseの genre だけでカテゴリ分け（画像名判定はしない）
  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const it of menuItems) {
      const label = toJapaneseGenreLabel(it.genre) || 'その他';
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(it);
    }

    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      const ai = GENRE_ORDER.indexOf(a[0]);
      const bi = GENRE_ORDER.indexOf(b[0]);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a[0].localeCompare(b[0], 'ja');
    });

    return entries.map(([category, items]) => ({ category, items }));
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
      if (seatParam) localStorage.setItem('newE3_seat', String(seatParam));
    } catch {}
    router.push('/checkout');
  };

  return (
    <Container maxW="container.xl" py={10}>
      <HStack spacing={8} align="start">
        <Box flex="3">
          <Heading as="h1" mb={6}>メニュー</Heading>

          {/* アコーディオンで genre ごとに表示（日本語ラベル） */}
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
                  {/* seat 配下なので ../ を付与（あなたの既存仕様維持） */}
                  <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
                    {items.map((item) => (
                      <GridItem key={item.id} borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
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

        {/* 注文カート */}
        <Box flex="1" p={6} borderWidth="1px" borderRadius="lg" position="sticky" top="2rem" boxShadow="md">
          <Heading as="h2" size="lg" mb={4}>注文カート</Heading>
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
