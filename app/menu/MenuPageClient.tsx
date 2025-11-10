'use client';

import { useMemo } from 'react';
import {
  Box, Grid, GridItem, Heading, Image, Text, HStack, Container,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Badge,
} from '@chakra-ui/react';
import type { MenuItem as BaseMenuItem } from './page';

// 既存型は変更せず、genre をオプションで受ける
type MenuItem = BaseMenuItem & { genre?: string | null };

interface MenuPageClientProps { menuItems: MenuItem[]; }

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
  const img = (item.image ?? '').toString();
  for (const p of IMAGE_PATTERNS) {
    if (p.re.test(img)) return { label: p.label, sort: p.sort };
  }
  return { label: 'その他', sort: 999 };
}

export default function MenuPageClient({ menuItems }: MenuPageClientProps) {
  // カテゴリ別にグループ化（並び順もここで）
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

  return (
    <Container maxW="container.xl" py={10}>
      <HStack spacing={8} align="start">
        <Box flex="3">
          <Heading as="h1" mb={6}>メニュー</Heading>

          {/* アコーディオンでカテゴリごとに表示 */}
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
                  {/* ★元のGrid描画そのまま（items だけカテゴリ内に差し替え） */}
                  <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
                    {items.map((item) => (
                      <GridItem key={item.id} borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
                        <Image src={item.image} alt={item.name} w="100%" h="200px" objectFit="cover" />
                        <Box p={4}>
                          <Text fontWeight="bold" fontSize="lg" noOfLines={1}>{item.name}</Text>
                          <Text mt={2} fontSize="xl" color="gray.800">¥{item.price.toLocaleString()}</Text>
                        </Box>
                      </GridItem>
                    ))}
                  </Grid>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Box>
      </HStack>
    </Container>
  );
}
