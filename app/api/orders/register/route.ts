import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {//注文登録APIハンドラー
  try {//エラーハンドリング用のtry-catchブロック
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL//SupabaseのURLを環境変数から取得
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY//Supabaseのサービスロールキーを環境変数から取得
    if (!supabaseUrl || !serviceRoleKey) {//URLかサービスロールキーが設定されていない場合
      return NextResponse.json({ error: 'server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 })
    }
    // Supabaseクライアントをサービスロールキーで初期化（認証情報を永続化しない設定）
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

    const body = await req.json()
    const seatNumber = Number(body.seatNumber)
    if (!Number.isInteger(seatNumber) || seatNumber < 1) {
      return NextResponse.json({ error: 'invalid seat' }, { status: 400 })
    }

    const nowIso = new Date().toISOString()

    // orders テーブルに seat_number ごとに最新の paid_at を登録（存在しなければ新規作成）
    const { data: upsertedRow, error: upsertError } = await supabaseAdmin// Supabaseクライアントでordersテーブルに対してupsert操作を実行
      .from('orders')
      .upsert([{ seat_number: seatNumber, paid_at: nowIso }], { onConflict: 'seat_number' })
      .select('*')
      .single();

    if (upsertError) {//upsert操作でエラーが発生した場合
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, row: upsertedRow })//成功時は登録された行データを返す
  } catch (err) {//エラー発生時は500エラーで返す
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
