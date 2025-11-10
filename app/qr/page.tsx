'use client';

import QrcodeReaderComponent from './QrcodeReaderComponent';
import { QrCode } from 'lucide-react';

export default function QRPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-xl rounded-3xl p-8 max-w-md mx-auto text-center">
        {/* ヘッダー部分 */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full mb-3">
            <QrCode className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            QRコードを読み取ってください
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            座席番号が自動的に認識されます
          </p>
        </div>

        {/* QRコード読み取りエリア */}
        <div className="border-2 border-dashed border-blue-300 rounded-2xl p-4 bg-gray-50 hover:bg-gray-100 transition">
          <QrcodeReaderComponent />
        </div>

        {/* フッターメッセージ */}
        <p className="text-gray-400 text-xs mt-6">
          読み取りが完了すると自動的にメニュー画面へ遷移します
        </p>
      </div>
    </main>
  );
}
