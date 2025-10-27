'use client'

import { ChakraProvider, Box } from '@chakra-ui/react'
import Header from '@/components/Header'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider>
        <Header />
        <Box as="main" pt="72px"> 
          {children}
        </Box>
      </ChakraProvider>
  )
}