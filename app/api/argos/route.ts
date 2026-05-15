import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function query(table: string, params: Record<string, string>) {
  const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year    = searchParams.get('year')   || '2026'
  const month   = searchParams.get('month')  || '3'
  const medor   = searchParams.get('medor')  || '742776'
  const medofis = searchParams.get('medofis') || null
  const tipo    = searchParams.get('tipo')   || 'novida'

  try {
    if (tipo === 'vida') {
      const params: Record<string, string> = {
        year: `eq.${year}`,
        month: `eq.${month}`,
        medor_code: `eq.${medor}`,
        order: 'negocio',
      }
      const data = await query('argos_vida', params)
      return NextResponse.json({ tipo: 'vida', year, month, medor, data })
    }

    const params: Record<string, string> = {
      year: `eq.${year}`,
      month: `eq.${month}`,
      medor_code: `eq.${medor}`,
      order: 'medofis_code,lob,ramo',
    }
    if (medofis) params.medofis_code = `eq.${medofis}`

    const data = await query('argos_no_vida', params)
    return NextResponse.json({ tipo: 'novida', year, month, medor, data })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
