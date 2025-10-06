'use client';
import { useEffect, useState } from 'react';
import QrcodeReader from './QrcodeReader';

export default function QrcodeReaderComponent() {
  const [mounted, setMounted] = useState(false);
  const [scannedTime, setScannedTime] = useState<Date | null>(null);
  const [scannedResult, setScannedResult] = useState('');

  useEffect(() => {
    setMounted(true); // クライアントでマウントされたことを検知
  }, []);

  const onNewScanResult = (result: string) => {
    setScannedTime(new Date());
    setScannedResult(result);

    try {
      const url = new URL(result);
      window.open(url.href, '_blank');
    } catch {
      console.warn('URLではありません:', result);
    }
  };

  if (!mounted) return null; // SSR 時は何も描画せず、クライアントマウント後に描画

  return (
    <>
      <div>
        <h2>
          スキャン日時：{scannedTime ? scannedTime.toLocaleString() : 'まだスキャンなし'}
        </h2>
        <h2>スキャン結果：{scannedResult}</h2>
      </div>
      <QrcodeReader onScanSuccess={onNewScanResult} onScanFailure={() => {}} />
    </>
  );
}
