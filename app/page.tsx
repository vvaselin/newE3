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
          <span className="inline-block bg-[#FFFFBF] rounded-md px-3 py-1">茨城大学日立食堂</span>
        </h1>
        <p className="mt-1 text-sm text-foreground/70">スタートメニュー</p>

        <div className="mt-5 grid gap-4">
          <Link
            href="/congestion"
            aria-label="混雑状況ページへ"
            className="flex items-center gap-3 rounded-xl border border-black/10 dark:border-white/15 bg-foreground text-background px-4 py-3 font-semibold hover:opacity-90"
          >
            <img src="/images/icon1.svg" alt="混雑アイコン" className="w-5 h-5" />
            <span>混雑状況</span>
          </Link>

          <Link
            href="/menu"
            aria-label="商品一覧ページへ"
            className="flex items-center gap-3 rounded-xl border border-black/10 dark:border-white/15 bg-background px-4 py-3 font-semibold hover:bg-black/[.05] dark:hover:bg-white/[.06]"
          >
            <img src="/images/icon2.svg" alt="メニューアイコン" className="w-5 h-5" />
            <span>商品一覧</span>
          </Link>

          <Link
            href="/qr"
            aria-label="QRコード読み取りページへ"
            className="flex items-center gap-3 rounded-xl border border-black/10 dark:border-white/15 bg-background px-4 py-3 font-semibold hover:bg-black/[.05] dark:hover:bg-white/[.06]"
          >
            <img src="/images/icon3.svg" alt="QRアイコン" className="w-5 h-5" />
            <span>QRコード読み取り</span>
          </Link>

          <Link
            href="/setSeat"
            aria-label="座席選択ページへ"
            className="flex items-center gap-3 rounded-xl border border-black/10 dark:border-white/15 bg-foreground text-background px-4 py-3 font-semibold hover:opacity-90"
          >
            <img src="/images/icon4.svg" alt="座席アイコン" className="w-5 h-5" />
            <span>座席選択・解除画面</span>
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