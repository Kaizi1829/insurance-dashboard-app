'use client'

import { useEffect, useState } from "react"

const months = [
"Enero","Febrero","Marzo","Abril","Mayo","Junio",
"Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
]

function show(v:any){
if(v===undefined || v===null) return "-"
return v
}

function colorRet(v:number){
if(v>=94) return "text-green-600 font-bold"
if(v>=90) return "text-orange-500 font-bold"
return "text-red-600 font-bold"
}

function colorTnp(v:number){
if(v>=10) return "text-green-600 font-bold"
if(v>=7) return "text-orange-500 font-bold"
return "text-red-600 font-bold"
}

function colorCor(v:number){
if(v<=85) return "text-green-600 font-bold"
if(v<=95) return "text-orange-500 font-bold"
return "text-red-600 font-bold"
}

function colorCrec(v:number){
if(v>0) return "text-green-600 font-bold"
if(v===0) return "text-orange-500 font-bold"
return "text-red-600 font-bold"
}

function colorIfValue(v:any,fn:any){
if(v===undefined || v===null) return ""
return fn(v)
}

export function TablaMedofi({ mediator }: { mediator:string }){

const [metrics,setMetrics] = useState<any[]>([])

useEffect(()=>{

function loadData(){

fetch("/api/metrics")
.then(res=>res.json())
.then(data=>setMetrics(data))

}

loadData()

window.addEventListener("metricsUpdated",loadData)

return ()=> window.removeEventListener("metricsUpdated",loadData)

},[])

function getMonthData(month:string){

const item = metrics.find(
(m:any)=>
m.month===month &&
m.mediatorCode===mediator &&
m.year===2026
)

return item || {}

}

return(

<div className="panel overflow-x-auto">

<table className="min-w-full text-left text-sm">

<thead className="border-b border-slate-200 text-slate-500">

<tr>

<th className="pb-3 pr-6">MES</th>
<th className="pb-3 pr-6">GWP</th>
<th className="pb-3 pr-6">%GWP</th>
<th className="pb-3 pr-6">GWPNP</th>
<th className="pb-3 pr-6">%GWPNP</th>
<th className="pb-3 pr-6">RET</th>
<th className="pb-3 pr-6">TNP</th>
<th className="pb-3">COR</th>

</tr>

</thead>

<tbody>

{months.map(month=>{

const data:any = getMonthData(month)

const ret = data.renovacionPct
const tnp = data.tasaNpPct
const cor = data.cor
const crecimiento = data.crecimientoPct

return(

<tr key={month} className="border-b border-slate-100">

<td className="py-4 pr-6 font-semibold">
{month.toUpperCase()}
</td>

<td className="py-4 pr-6">
{show(data.gwp)}
</td>

<td className={`py-4 pr-6 ${colorIfValue(crecimiento,colorCrec)}`}>
{show(crecimiento)}{crecimiento!==undefined && crecimiento!==null ? "%" : ""}
</td>

<td className="py-4 pr-6">
{show(data.gwpnp)}
</td>

<td className="py-4 pr-6">
-
</td>

<td className={`py-4 pr-6 ${colorIfValue(ret,colorRet)}`}>
{show(ret)}{ret!==undefined && ret!==null ? "%" : ""}
</td>

<td className={`py-4 pr-6 ${colorIfValue(tnp,colorTnp)}`}>
{show(tnp)}{tnp!==undefined && tnp!==null ? "%" : ""}
</td>

<td className={`py-4 ${colorIfValue(cor,colorCor)}`}>
{show(cor)}
</td>

</tr>

)

})}

</tbody>

</table>

</div>

)

}