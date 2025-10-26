'use client'

import { Button } from '@chakra-ui/react'
import type { ButtonProps } from '@chakra-ui/react'

export default function AdminButton(props: ButtonProps) {
  return (
    <Button
      colorScheme="teal"
      {...props} 
    >
      {props.children || 'Click Me'} 
    </Button>
  )
}