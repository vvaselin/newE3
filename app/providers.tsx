'use client'

import { ChakraProvider, Box } from '@chakra-ui/react'
import Header from '@/components/Header'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider>
        <Header /> {/* ★ヘッダーをここに追加 */}
        
        {/* ★ヘッダーの高さ分、メインコンテンツに上方向の余白（padding-top）を持たせる */}
        {/* 72pxはヘッダーの高さ（p={4}など）に応じた仮の値です */}
        <Box as="main" pt="72px"> 
          {children}
        </Box>
      </ChakraProvider>
  )
}