'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Grid, GridItem, Heading, Image, Text, HStack, Container,
} from '@chakra-ui/react';
import type { MenuItem } from './page';

interface CartItem extends MenuItem { quantity: number; }
interface MenuPageClientProps { menuItems: MenuItem[]; }

export default function MenuPageClient({ menuItems }: MenuPageClientProps) {

  return (
    <Container maxW="container.xl" py={10}>
      <HStack spacing={8} align="start">
        <Box flex="3">
          <Heading as="h1" mb={6}>メニュー</Heading>
          <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
            {menuItems.map((item) => (
              <GridItem key={item.id} borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
                <Image src={item.image} alt={item.name} w="100%" h="200px" objectFit="cover" />
                <Box p={4}>
                  <Text fontWeight="bold" fontSize="lg" noOfLines={1}>{item.name}</Text>
                  <Text mt={2} fontSize="xl" color="gray.800">¥{item.price.toLocaleString()}</Text>
                  
                </Box>
              </GridItem>
            ))}
          </Grid>
        </Box>

        
      </HStack>
    </Container>
  );
}
