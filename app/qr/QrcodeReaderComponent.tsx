'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QrcodeReader from './QrcodeReader';
import { createClient } from '@/utils/supabase/client';

// 席数の指定
const SEATS_NUM = 10;

export interface Seat {
  id: number;
  seated_at: Date;
  status: number;
}

export default function QrcodeReaderComponent() {
  const [mounted, setMounted] = useState(false);
  const [scannedTime, setScannedTime] = useState<Date | null>(null);
  const [scannedResult, setScannedResult] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // ユーザーIDを取得
  async function getUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('ログインが必要です');
      return null;
    }
    return user.id;
  }
  
  // 座席情報を追加
  async function addSeats(seatId: number) {
    const userId = await getUserId();
    await supabase.from('seats').insert([{
      id: seatId,
      seated_at: new Date(new Date().toISOString()),
      status: 1,
      user_id: userId
    }])
  }

  // 座席登録
  const SeatRegister = async (seatId: number) => {
    if (seatId >= 1 && seatId <= SEATS_NUM) {
      await addSeats(seatId);
    } else {
      alert('有効な席番号を入力してください');
      return;
    }
  }


  useEffect(() => {
    setMounted(true);
  }, []);

  const onNewScanResult = (result: string) => {
    setScannedTime(new Date());
    setScannedResult(result);

    // QRコードから座席番号を抽出（数字のみ）
    const seatNumber = result.match(/\d+/)?.[0];
    if (seatNumber) {
      SeatRegister(Number(seatNumber));
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
