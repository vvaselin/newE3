import React from 'react'
import { createClient } from '@/utils/supabase/server'

export default async function Page() {
  // サーバーサイドで Supabase クライアントを作成して orders を取得
  const supabase = await createClient()
  const { data, error } = await supabase.from('orders').select('id, seat_number, paid_at, cooking').order('paid_at', { ascending: false })

  if (error) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Orders Debug</h1>
        <p style={{ color: 'red' }}>Error fetching orders: {error.message}</p>
      </main>
    )
  }

  const rows = Array.isArray(data) ? data : []

  return (
    <main style={{ padding: 20 }}>
      <h1>Orders Debug</h1>
      <p>サーバーから取得した `orders` テーブルの生データを表示します。</p>
      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>id</th>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>seat_number</th>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>paid_at</th>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>cooking</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id ?? String(r.seat_number) + String(r.paid_at)}>
                <td style={{ border: '1px solid #eee', padding: 8, verticalAlign: 'top' }}>{String(r.id ?? '')}</td>
                <td style={{ border: '1px solid #eee', padding: 8, verticalAlign: 'top' }}>{String(r.seat_number ?? '')}</td>
                <td style={{ border: '1px solid #eee', padding: 8, verticalAlign: 'top' }}>{String(r.paid_at ?? '')}</td>
                <td style={{ border: '1px solid #eee', padding: 8, verticalAlign: 'top' }}>{String(r.cooking ?? '')}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ border: '1px solid #eee', padding: 8 }}>データがありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
