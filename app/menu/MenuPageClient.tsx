'use client';

import { useMemo } from 'react';
import {
  Box, Grid, GridItem, Heading, Image, Text, HStack, Container,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Badge,
} from '@chakra-ui/react';
import type { MenuItem as BaseMenuItem } from './page';

// Supabaseから来る genre をこのファイル内でだけ拡張して受け取る
type MenuItem = BaseMenuItem & { genre?: string | null };

interface MenuPageClientProps { menuItems: MenuItem[]; }

// 英語ジャンル → 日本語ラベル（大小/表記ゆれを正規化して対応）
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

// 表示順（ここにないジャンルは最後に回す）
const GENRE_ORDER = ['主菜', '副菜・サラダ', '丼物・カレー', '麺類', 'ごはん', '汁物', 'デザート', 'その他'];

function toJapaneseGenreLabel(raw?: string | null): string {
  if (!raw) return 'その他';
  const key = raw.toString().trim().toLowerCase().replace(/[_\s]+/g, '-');
  return GENRE_LABELS[key] ?? raw; // 既に日本語ならそのまま出す
}

export default function MenuPageClient({ menuItems }: MenuPageClientProps) {
  // ★ Supabaseの genre だけでカテゴリ分け（画像名からの推定はしない）
  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const it of menuItems) {
      const label = toJapaneseGenreLabel(it.genre) || 'その他';
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(it);
    }

    // 並び順：GENRE_ORDER → そのほかは五十音順で後ろに
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
