// app/page.tsx
import Link from "next/link";

export default function Page() {
  return (
    <div className="grid min-h-dvh place-items-center p-5">
      <main
        className="w-full max-w-[560px] rounded-2xl border border-black/10 dark:border-white/15 bg-background text-foreground p-6 shadow-2xl"
        role="region"
        aria-labelledby="title"
      >
        <h1 id="title" className="text-xl font-bold">茨城大学日立食堂</h1>
        <p className="mt-1 text-sm text-foreground/70">スタートメニュー</p>

        <div className="mt-5 grid gap-4">
          <Link
            href="/congestion"
            aria-label="混雑状況ページへ"
            className="block rounded-xl border border-black/10 dark:border-white/15 bg-foreground text-background px-4 py-3 text-center font-semibold hover:opacity-90"
          >
            混雑状況
          </Link>

          <Link
            href="/menu"
            aria-label="商品一覧ページへ"
            className="block rounded-xl border border-black/10 dark:border-white/15 bg-background px-4 py-3 text-center font-semibold hover:bg-black/[.05] dark:hover:bg-white/[.06]"
          >
            商品一覧
          </Link>

          <Link
            href="/qr"
            aria-label="QRコード読み取りページへ"
            className="block rounded-xl border border-black/10 dark:border-white/15 bg-background px-4 py-3 text-center font-semibold hover:bg-black/[.05] dark:hover:bg-white/[.06]"
          >
            QRコード読み取り
          </Link>
          
          <Link
            href="/setSeat"
            aria-label="座席設定ページへ"
            className="block rounded-xl border border-black/10 dark:border-white/15 bg-background px-4 py-3 text-center font-semibold hover:bg-black/[.05] dark:hover:bg-white/[.06]"
          >
            座席設定・解除
          </Link>

        </div>
      </main>
    </div>
  );
}