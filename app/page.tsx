// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import AdminButton from "@/components/AdminButton"; // AdminButtonコンポーネントをインポート

export default function Page() { // ページコンポーネント
  const handleAdminClick = () => { // 管理者ボタンクリック時のハンドラー
    console.log("Admin button clicked"); // コンソールにメッセージを出力
  }

  return (// ページのJSXを返す
    <div className="grid min-h-dvh place-items-center p-5">
      <main
        className="w-full max-w-[560px] rounded-2xl border border-black/10 dark:border-white/15 bg-background text-foreground p-6 shadow-2xl" // メインコンテナのスタイル（背景を白に戻す）
        role="region"
        aria-labelledby="title"
      >

        <h1 id="title" className="font-bold" style={{ fontSize: '1.5em' }}>
          <span className="inline-block bg-[#FFFFBF] rounded-lg px-3 py-1">茨城大学日立食堂</span>
        </h1>
        <p className="mt-1 text-sm text-foreground/70">スタートメニュー</p>

  <div className="mt-5 grid grid-cols-2 gap-4">
          <Link
            href="/congestion"
            aria-label="混雑状況ページへ"
            className="block rounded-xl border border-black/10 dark:border-white/15 bg-foreground text-background px-4 py-3 font-semibold hover:opacity-90"
          >
            <div className="flex flex-col items-center gap-2">
              <span>混雑状況</span>
              <img src="/images/conzatsu.png" alt="混雑アイコン" className="w-10 h-10 object-contain" />
            </div>
          </Link>

          <Link
            href="/menu"
            aria-label="商品一覧ページへ"
            className="block rounded-xl border border-black/10 dark:border-white/15 bg-background px-4 py-3 font-semibold hover:bg-black/[.05] dark:hover:bg-white/[.06]"
          >
            <div className="flex flex-col items-center gap-2">
              <span>商品一覧</span>
              <img src="/images/eat.png" alt="メニューアイコン" className="w-10 h-10 object-contain" />
            </div>
          </Link>

          <Link
            href="/qr"
            aria-label="QRコード読み取りページへ"
            className="block rounded-xl border border-black/10 dark:border-white/15 bg-background px-4 py-3 font-semibold hover:bg-black/[.05] dark:hover:bg-white/[.06]"
          >
            <div className="flex flex-col items-center gap-2">
              <span>QRコード読み取り</span>
              <img src="/images/qrcode.png" alt="QRアイコン" className="w-10 h-10 object-contain" />
            </div>
          </Link>

          <Link
            href="/orderState"
            aria-label="注文状態表示ページへ"
            className="block rounded-xl border border-black/10 dark:border-white/15 bg-foreground text-background px-4 py-3 font-semibold hover:opacity-90"
          >
            <div className="flex flex-col items-center gap-2">
              <span>注文状況の確認</span>
              <img src="/images/zaseki.png" alt="座席アイコン" className="w-10 h-10 object-contain" />
            </div>
          </Link>
        </div>

        <Image
          src="/images/cafeteria.png"
          alt="学食の外観"
          width={800}
          height={400}
          // 一時的に画像最適化を無効化して問題を切り分ける
          unoptimized
          className="rounded-xl mt-4 object-cover"
        />
      </main>
    </div>
  );
}