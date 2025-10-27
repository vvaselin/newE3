import React from 'react';
import SeatsClient from './SeatsClient';
import Link from 'next/link';

export default function Page() {
return (
		<main style={{ padding: 20, fontFamily: 'system-ui, Arial, Helvetica, sans-serif' }}>
			<h1 style={{ fontSize:
				 20, marginBottom: 12 }}>座席設定ページ（20行×10列）</h1>
			<Link
        	href="/"
        	aria-label="トップページへ戻る"
        	className="block rounded-xl border border-black/10 dark:border-white/15 bg-foreground text-background px-4 py-3 text-center font-semibold hover:opacity-90"
      		>
        	---トップへ戻る---
      		</Link>
				<SeatsClient />
			</main>
		);
	}