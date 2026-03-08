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



export default function Medofis(){

const [year,setYear] = useState(2026)
const [mediator,setMediator] = useState("GLOBAL")
const [metrics,setMetrics] = useState<any[]>([])

useEffect(()=>{

fetch("/api/metrics")
.then(res=>res.json())
.then(data=>{

if(!Array.isArray(data)) return

setMetrics(data)

})

},[])



const filtered = metrics
.filter(m => m.year == year && m.mediatorCode == mediator)
.sort((a,b)=> months.indexOf(a.month) - months.indexOf(b.month))



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
<option value={2026}>2026</option>
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
<th className="text-left p-4">COR</th>

</tr>

</thead>

<tbody>

{filtered.map((m,index)=>{

const gwp = Number(m.medofis?.gwp) || 0
const crecimiento = Number(m.medofis?.crecimientoPct) || 0
const renovacion = Number(m.medofis?.renovacionPct) || 0
const tnp = Number(m.medofis?.tasaNpPct) || 0
const cor = Number(m.medofis?.cor) || 0

return(

<tr
key={index}
className="border-t hover:bg-slate-50"
>

<td className="p-4 font-medium text-slate-700">
{m.month}
</td>

<td className="p-4">
{gwp.toLocaleString("es-ES")} €
</td>

<td className={`p-4 ${colorGWP(crecimiento)}`}>
{crecimiento}%
</td>

<td className={`p-4 ${colorRetention(renovacion)}`}>
{renovacion}%
</td>

<td className={`p-4 ${colorTNP(tnp)}`}>
{tnp}%
</td>

<td className={`p-4 ${colorCOR(cor)}`}>
{cor}%
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