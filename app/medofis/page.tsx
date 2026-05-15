"use client"

import { useEffect, useState } from "react"

const months = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
]

const mediators = [
  "GLOBAL",
  "742776",
  "755224",
  "742826"
]

/* ---------- COLORES ---------- */

function colorGWP(value:number){

  if(value < 0) return "text-red-600 font-semibold"
  if(value <= 5) return "text-orange-500 font-semibold"
  return "text-green-600 font-semibold"

}

function colorRetention(value:number){

  if(value < 70) return "text-red-600 font-semibold"
  if(value <= 90) return "text-orange-500 font-semibold"
  return "text-green-600 font-semibold"

}

function colorTNP(value:number){

  if(value < 10) return "text-red-600 font-semibold"
  if(value < 15) return "text-orange-500 font-semibold"
  return "text-green-600 font-semibold"

}

function colorCOR(value:number){

  if(value > 100) return "text-red-600 font-semibold"
  return "text-green-600 font-semibold"

}

function colorSiniestralidadSinIBNR(value:number){

  if(value <= 50) return "text-green-600 font-semibold"
  if(value <= 60) return "text-orange-500 font-semibold"
  return "text-red-600 font-semibold"

}

/* ---------- NUMBER PARSER ---------- */

function toNumber(value:any){

  if(value === undefined || value === null || value === ""){
    return 0
  }

  if(typeof value === "number"){
    return value
  }

  let str = value.toString().trim().replace("€","").replace(/\s/g,"")

  const hasComma = str.includes(",")
  const hasDot = str.includes(".")

  if(hasComma && hasDot){
    str = str.replace(/\./g,"").replace(",",".")
  }
  else if(hasComma){
    str = str.replace(",",".")
  }

  str = str.replace(/[^0-9.-]/g,"")

  return Number(str) || 0
}

export default function Medofis(){

  const [year,setYear] = useState(2026)
  const [mediator,setMediator] = useState("GLOBAL")
  const [metrics,setMetrics] = useState<any[]>([])
  const [years,setYears] = useState<number[]>([])

  useEffect(()=>{

    async function load(){

      const res = await fetch("/api/metrics")
      const data = await res.json()

      if(!Array.isArray(data)) return

      setMetrics(data)

      const availableYears = [
        ...new Set(
          data
            .map((m:any)=>Number(m.year))
            .filter((y:number)=>!Number.isNaN(y))
        )
      ].sort((a,b)=>b-a)

      setYears(availableYears)

    }

    load()

  },[])

  const filtered = metrics
    .filter(
      m =>
        Number(m.year) === year &&
        (m.mediator_code ?? m.mediatorCode) === mediator
    )
    .sort((a,b)=> Number(a.month) - Number(b.month))

  return(

    <div className="space-y-8">

      {/* CABECERA */}

      <div className="bg-white rounded-2xl p-6 border flex justify-between items-center">

        <div>

          <h1 className="text-2xl font-bold text-slate-800">
            Medofis
          </h1>

          <p className="text-slate-500 text-sm">
            Seguimiento mensual por mediador
          </p>

        </div>

        <div className="flex gap-3">

          <select
            value={year}
            onChange={(e)=>setYear(Number(e.target.value))}
            className="border rounded-lg px-3 py-2"
          >
            {years.map(y=>(
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={mediator}
            onChange={(e)=>setMediator(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            {mediators.map(m=>(
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

        </div>

      </div>

      {/* TABLA */}

      <div className="bg-white rounded-2xl border overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-slate-100 text-slate-600">

            <tr>

              <th className="text-left p-4">Mes</th>
              <th className="text-left p-4">GWP</th>
              <th className="text-left p-4">% GWP</th>
              <th className="text-left p-4">Retención</th>
              <th className="text-left p-4">TNP</th>
              <th className="text-left p-4">S. sin IBNR</th>
              <th className="text-left p-4">COR</th>
              
            </tr>

          </thead>

          <tbody>

            {filtered.map((m,index)=>{

              const gwp = toNumber(m.medofis?.gwp)
              const crecimiento = toNumber(m.medofis?.crecimientoPct)
              const renovacion = toNumber(m.medofis?.renovacionPct)
              const tnp = toNumber(m.medofis?.tasaNpPct)
              const cor = toNumber(m.medofis?.cor)
              const siniestralidadSinIBNR = toNumber(m.medofis?.siniestralidadSinIbnrPct)

              const emptyRow =
                gwp === 0 &&
                crecimiento === 0 &&
                renovacion === 0 &&
                tnp === 0 &&
                cor === 0 &&
                siniestralidadSinIBNR === 0

              const monthName =
                typeof m.month === "number"
                  ? months[m.month - 1]
                  : m.month

              return(

                <tr
                  key={index}
                  className="border-t hover:bg-slate-50"
                >

                  <td className="p-4 font-medium text-slate-700">
                    {monthName}
                  </td>

                  <td className="p-4">
                    {emptyRow ? "-" : gwp.toLocaleString("es-ES") + " €"}
                  </td>

                  <td className={`p-4 ${emptyRow ? "" : colorGWP(crecimiento)}`}>
                    {emptyRow ? "-" : crecimiento.toFixed(1) + "%"}
                  </td>

                  <td className={`p-4 ${emptyRow ? "" : colorRetention(renovacion)}`}>
                    {emptyRow ? "-" : renovacion.toFixed(1) + "%"}
                  </td>

                  <td className={`p-4 ${emptyRow ? "" : colorTNP(tnp)}`}>
                    {emptyRow ? "-" : tnp.toFixed(1) + "%"}
                  </td>

                   <td className={`p-4 ${emptyRow ? "" : colorSiniestralidadSinIBNR(siniestralidadSinIBNR)}`}>
                    {emptyRow ? "-" : siniestralidadSinIBNR.toFixed(1) + "%"}
                  </td>

                  <td className={`p-4 ${emptyRow ? "" : colorCOR(cor)}`}>
                    {emptyRow ? "-" : cor.toFixed(1) + "%"}
                  </td>

                 

                </tr>

              )

            })}

          </tbody>

        </table>

      </div>

    </div>

  )

}