import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function supaFetch(table: string, params: Record<string, string>) {
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams
  const year   = p.get('year')   || '2026'
  const month  = p.get('month')  || '4'
  const medor  = p.get('medor')  || '742776'
  const medofis = p.get('medofis') || 'TOTAL'

  try {
    const [nv, vida] = await Promise.all([
      supaFetch('argos_no_vida', {
        year:          `eq.${year}`,
        month:         `eq.${month}`,
        medor_code:    `eq.${medor}`,
        medofis_code:  `eq.${medofis}`,
        select:        'lob,ramo,subramo,gwp,gwpa,gwp_pct,gwpnp,gwpnpa,np,np_ant,net_inflow,tasa_np_pct,pte_p_adq_pct,cor',
        order:         'lob,ramo,subramo',
      }),
      supaFetch('argos_vida', {
        year:       `eq.${year}`,
        month:      `eq.${month}`,
        medor_code: `eq.${medor}`,
        select:     'lob,negocio,gwpnp,gwpnpa,gwp,gwpa',
        order:      'lob,negocio',
      }),
    ])

    return NextResponse.json({ nv, vida })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
