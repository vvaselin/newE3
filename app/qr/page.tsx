'use client';

import QrcodeReaderComponent from './QrcodeReaderComponent';


export default function QRPage() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">QRコード読み取り</h1>
      <QrcodeReaderComponent />
    </main>
  );
}