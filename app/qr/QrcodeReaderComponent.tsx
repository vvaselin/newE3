'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QrcodeReader from './QrcodeReader';

export default function QrcodeReaderComponent() {
  const [mounted, setMounted] = useState(false);
  const [scannedTime, setScannedTime] = useState<Date | null>(null);
  const [scannedResult, setScannedResult] = useState('');
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const onNewScanResult = (result: string) => {
    setScannedTime(new Date());
    setScannedResult(result);

    // QRコードから座席番号を抽出（数字のみ）
    const seatNumber = result.match(/\d+/)?.[0];
    if (seatNumber) {
      console.log(`座席番号: ${seatNumber}`);
      router.push(`/menu/${seatNumber}`);
    } else {
      console.warn('座席番号が認識できません:', result);
      alert('QRコードに座席番号が含まれていません。');
    }
  };

  if (!mounted) return null;

  return (
    <div>
      <div className="text-sm text-gray-700 mb-2">
        スキャン日時：{scannedTime ? scannedTime.toLocaleString() : 'まだスキャンなし'}
        <br />
        スキャン結果：{scannedResult || '---'}
      </div>
      <QrcodeReader onScanSuccess={onNewScanResult} onScanFailure={() => {}} />
    </div>
  );
}
