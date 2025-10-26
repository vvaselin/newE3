import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server' // サーバー用クライアント
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 認証成功時、カスタムの「認証完了ページ」にリダイレクト
      return NextResponse.redirect(new URL('/auth/confirmed', request.url))
    }
  }

  // 認証失敗時、エラーページ（またはトップ）にリダイレクト
  console.error('認証に失敗しました。')
  return NextResponse.redirect(new URL('/auth/error', request.url)) // エラー用ページ（ステップ3参照）
}