// app/setSeat/SeatsClient.tsx
'use client'; // <- これがないとブラウザ専用のフック(useState等)が使えません

import React, { useEffect, useState } from 'react';

const ROWS = 20;
const COLS = 10;
type Seats = boolean[][];

/** 何もない状態（全て空席）を作る */
function makeEmpty(): Seats {//Array.from で二次元配列を初期化,行ごとの配列を生成
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => false));
}

/** localStorage から読み込む（正しい形でなければ空にする） */
function loadFromLocalStorage(): Seats {//localStorage の seats_v1 キーから文字列を読み出し、JSON 解析して Seats として返す
  try {
    const raw = localStorage.getItem('seats_v1');
    if (!raw) return makeEmpty();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== ROWS || !Array.isArray(parsed[0]) || parsed[0].length !== COLS) {
      return makeEmpty();
    }
    return parsed as Seats;
  } catch {
    return makeEmpty();
  }
}

/** localStorage に保存 */
function saveToLocalStorage(seats: Seats) {
  try {
    localStorage.setItem('seats_v1', JSON.stringify(seats));
  } catch {
    // 失敗しても無視（容量超過など）
  }
}

export default function Page() {
  // 初期値はクライアント側で localStorage から読み込む
  const [seats, setSeats] = useState<Seats>(() => {
    // 初期化関数は最初のレンダリング時に一度だけ呼ばれる
    return typeof window !== 'undefined' ? loadFromLocalStorage() : makeEmpty();
  });

  // モード: "occupy" = 座席利用（ONにする）, "release" = 席解除（OFFにする）
  const [mode, setMode] = useState<'occupy' | 'release'>('occupy');

  // seats が変わるたびに localStorage に保存（永続化）
  useEffect(() => {
    saveToLocalStorage(seats);
  }, [seats]);

  // クリック時の処理
  function handleSeatClick(r: number, c: number) {
    setSeats(prev => {
      const next = prev.map(row => row.slice()); // 二次元配列をコピー（不変性を保つ）
      next[r][c] = mode === 'occupy';
      return next;
    });
  }

  // 全解除（すべて空席に戻す）
  function resetAll() {
    setSeats(makeEmpty());
  }

  // 座席の占有数を数える（表示用）
  const occupiedCount = seats.flat().filter(Boolean).length;//flat()で一次元配列に変換.filter(Boolean)でtrueの要素のみカウント
  const total = ROWS * COLS;//全座席数

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 20 }}>
      {/* <h1>座席予約（{ROWS} 行 × {COLS} 列）</h1> */}

      <div style={{ margin: '12px 0' }}>
        <strong>モード：</strong>
        <button
          onClick={() => setMode('occupy')}
          style={{
            marginRight: 8,//ボタン間のスペース
            padding: '6px 10px',//ボタン内の余白
            background: mode === 'occupy' ? '#8fceebff' : '#f5f5f5ff',
            border: '1px solid #ccc',//ボタンの境界線
            borderRadius: 6,//ボタンの角を丸くする
            cursor: 'pointer'
          }}
        >
          座席利用
        </button>
        <button
          onClick={() => setMode('release')}
          style={{
            padding: '6px 10px',
            background: mode === 'release' ? '#ff6b6b' : '#eee',
            border: '1px solid #ccc',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          席解除
        </button>

        <button
          onClick={resetAll}
          style={{
            marginLeft: 16,
            padding: '6px 10px',
            background: '#ffeb90ff',
            border: '1px solid #ccc',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          全リセット
        </button>

        <span style={{ marginLeft: 12 }}>
          占有 {occupiedCount}/{total}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 36px)`,
          gap: 6,
          alignItems: 'center'
        }}
      >
        {seats.map((row, rIdx) =>
          row.map((occupied, cIdx) => (
            <button
              key={`${rIdx}-${cIdx}`}
              onClick={() => handleSeatClick(rIdx, cIdx)}//座席クリック時に handleSeatClick を呼び出す
              title={`行 ${rIdx + 1} 列 ${cIdx + 1}`}//ツールチップ表示
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                border: '1px solid #888',//座席の境界線
                background: occupied ? '#ff6b6b' : '#8fceebff',//占有されているかで色を変える
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 18,
                userSelect: 'none'
              }}
            >
              {occupied ? '●' : '○'}
            </button>//占有されている場合は黒丸、空席の場合は白丸を表示
          ))
        )}
      </div>
    <h1>座席予約（{ROWS} 行 × {COLS} 列）</h1>
      <div style={{ marginTop: 12 }}>
        <small>メモ：このサンプルはブラウザの localStorage に保存します。別のブラウザ・別PCでは共有されません。</small>
      </div>
    </main>
  );
}
