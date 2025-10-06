import React from 'react';
import SeatsClient from './SeatsClient';

export default function Page() {
return (
<main style={{ padding: 20, fontFamily: 'system-ui, Arial, Helvetica, sans-serif' }}>
<h1 style={{ fontSize: 20, marginBottom: 12 }}>座席設定ページ（20×10）</h1> <SeatsClient /> </main>
);
}
