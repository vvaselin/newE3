import React from 'react';
import OrderState from './OrderState';
import Link from 'next/link';

export default function Page() {
return (
    <main style={{ padding: 20, fontFamily: 'system-ui, Arial, Helvetica, sans-serif' }}>
        <h1 style={{ fontSize:
                20, marginBottom: 12 }}>注文状態</h1>
            <OrderState  />
        </main>
    );
}