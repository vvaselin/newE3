import React from 'react';
import OrderState from './OrderState';
import Link from 'next/link';
import { Heading, Box } from '@chakra-ui/react';

export default function Page() {
    return (
        <main style={{ padding: 20, fontFamily: 'system-ui, Arial, Helvetica, sans-serif' }}>
            <Box mb={6}>
                <Heading as="h1" size="lg">注文状態の表示</Heading>
            </Box>

            <OrderState />
        </main>
    );
}