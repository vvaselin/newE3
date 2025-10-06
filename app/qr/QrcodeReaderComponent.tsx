'use client';
import { useEffect, useState } from 'react';
import QrcodeReader from './QrcodeReader';
 
export default function QrcodeReaderComponent() {
  const [scannedTime, setScannedTime] = useState(new Date());
  const [scannedResult, setScannedResult] = useState('');
 
  useEffect(() => {}, [scannedTime, scannedResult]);
 
  // QRコードを読み取った時の実行する関数
  const onNewScanResult = (result: any) => {
    console.log('QRコードスキャン結果');
    console.log(result);
    setScannedTime(new Date());
    setScannedResult(result);
  };
  return (
    <>
      <div>
        <h2>スキャン日時：{scannedTime.toLocaleDateString()}</h2>
        <h2>スキャン結果：{scannedResult}</h2>
      </div>
      <QrcodeReader
        onScanSuccess={onNewScanResult}
        onScanFailure={(error: any) => {
          // console.log('Qr scan error');
        }}
      />
    </>
  );
}