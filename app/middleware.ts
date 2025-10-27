import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { response, supabase } = await updateSession(request)
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // /admin ページへのアクセス制御
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // 未ログインの場合はログインページへリダイレクト
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error || !profile || profile.role !== 'admin') {
      // 管理者でない、またはプロファイルの取得に失敗した場合
      console.warn('Admin access denied for user:', user.email)
      url.pathname = '/' // トップページにリダイレクト
      return NextResponse.redirect(url)
    }
  }

  // /login ページへのアクセス制御
  if (request.nextUrl.pathname === '/login') {
    if (user) {
      // ログイン済みの場合はトップページへリダイレクト
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // セッション情報を更新してレスポンスを返す
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}