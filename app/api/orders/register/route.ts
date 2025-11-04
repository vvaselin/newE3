import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

    const body = await req.json()
    const seatNumber = Number(body.seatNumber)
    if (!Number.isInteger(seatNumber) || seatNumber < 1) {
      return NextResponse.json({ error: 'invalid seat' }, { status: 400 })
    }

    const nowIso = new Date().toISOString()

    // upsert and return the upserted row in one call to avoid race/consistency issues
    const { data: upsertedRow, error: upsertError } = await supabaseAdmin
      .from('orders')
      .upsert([{ seat_number: seatNumber, paid_at: nowIso }], { onConflict: 'seat_number' })
      .select('*')
      .single();

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, row: upsertedRow })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
