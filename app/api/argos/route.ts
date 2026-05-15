import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year    = parseInt(searchParams.get('year')   || '2026')
  const month   = parseInt(searchParams.get('month')  || '3')
  const medor   = searchParams.get('medor')   || '742776'
  const medofis = searchParams.get('medofis') || null
  const tipo    = searchParams.get('tipo')    || 'novida'

  try {
    if (tipo === 'vida') {
      const { data, error } = await supabase
        .from('argos_vida')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .eq('medor_code', medor)
        .order('negocio')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ tipo: 'vida', year, month, medor, data })
    }

    if (tipo === 'resumen') {
      let q = supabase
        .from('argos_no_vida')
        .select('year,month,medor_code,medofis_code,lob,gwp,gwpa,gwpnp,pol,net_inflow,cor,primas_adq,siniestralidad_sin_ibnr')
        .eq('year', year).eq('month', month).eq('medor_code', medor)
        .eq('lob', 'Total').eq('subramo', '').order('medofis_code')
      if (medofis) q = q.eq('medofis_code', medofis)
      const { data, error } = await q
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ tipo: 'resumen', year, month, medor, data })
    }

    let q = supabase
      .from('argos_no_vida')
      .select('*')
      .eq('year', year).eq('month', month).eq('medor_code', medor)
      .order('medofis_code').order('lob').order('ramo')
    if (medofis) q = q.eq('medofis_code', medofis)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ tipo: 'novida', year, month, medor, data })

  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
