export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
      <h1 className="text-3xl font-bold mb-4 text-green-600">送信が完了しました！</h1>
      <p className="text-gray-600 mb-8">
        お問い合わせありがとうございます。内容を確認のうえ、担当者よりご連絡いたします。
      </p>
      <a
        href="/"
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        ホームに戻る
      </a>
    </div>
  );
}
