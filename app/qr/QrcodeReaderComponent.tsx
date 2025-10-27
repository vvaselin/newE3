'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QrcodeReader from './QrcodeReader';

export default function QrcodeReaderComponent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scannedTime, setScannedTime] = useState<Date | null>(null);
  const [scannedResult, setScannedResult] = useState('');
  const [scanned, setScanned] = useState(false); // 二重遷移防止用

  useEffect(() => {
    setMounted(true); // クライアントでマウントされたことを検知
  }, []);

  const onNewScanResult = (result: string) => {
    if (scanned) return; // すでに遷移済みなら無視

    setScannedTime(new Date());
    setScannedResult(result);

    // 数字だけ取り出して座席番号として遷移
    const seatNumber = result.match(/\d+/)?.[0];
    if (seatNumber) {
      setScanned(true);
      router.push(`/menu/${seatNumber}`);
      return;
    }

    // URLの場合は別タブで開く
    try {
      const url = new URL(result);
      window.open(url.href, '_blank');
    } catch {
      console.warn('URLでも座席番号でもありません:', result);
    }
  };

  if (!mounted) return null; // SSR時は何も描画しない

  return (
    <>
      <div className="mb-4 text-center">
        <h2>
          スキャン日時：{scannedTime ? scannedTime.toLocaleString() : 'まだスキャンなし'}
        </h2>
        <h2>スキャン結果：{scannedResult}</h2>
      </div>
      <QrcodeReader onScanSuccess={onNewScanResult} onScanFailure={() => {}} />
    </>
  );
}

