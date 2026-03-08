'use client'

import { useState } from "react"

const fields = [
'Renovación (%)',
'Tasa NP (%)',
'Pólizas NP',
'Pólizas',
'NetInflow',
'GWP',
'Crecimiento (%)',
'GWPNP',
'COR'
]

export default function DataPage(){

const [year,setYear] = useState(2026)
const [month,setMonth] = useState("Enero")
const [mediator,setMediator] = useState("GLOBAL")
const [formData,setFormData] = useState<any>({})

const handleChange=(field:string,value:string)=>{
setFormData({...formData,[field]:value})
}

const handleSubmit = async () => {

const payload = {
year,
month,
mediatorCode: mediator,
renovacionPct:Number(formData["Renovación (%)"]),
tasaNpPct:Number(formData["Tasa NP (%)"]),
polizasNp:Number(formData["Pólizas NP"]),
polizas:Number(formData["Pólizas"]),
netInflow:Number(formData["NetInflow"]),
gwp:Number(formData["GWP"]),
crecimientoPct:Number(formData["Crecimiento (%)"]),
gwpnp:Number(formData["GWPNP"]),
cor:Number(formData["COR"])
}

const res = await fetch("/api/metrics",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(payload)
})

if(res.ok){

alert("Datos guardados correctamente")

window.dispatchEvent(new Event("metricsUpdated"))

}

}

return(

<div className="space-y-6">

<section>

<p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
Registro y edición
</p>

<h2 className="mt-2 text-3xl font-bold">
Carga de datos mensuales
</h2>

</section>

<form className="panel space-y-6">

<div className="grid gap-4 md:grid-cols-3">

<select onChange={(e)=>setYear(Number(e.target.value))}>
<option value={2026}>2026</option>
<option value={2025}>2025</option>
</select>

<select onChange={(e)=>setMonth(e.target.value)}>
<option>Enero</option>
<option>Febrero</option>
<option>Marzo</option>
<option>Abril</option>
<option>Mayo</option>
<option>Junio</option>
<option>Julio</option>
<option>Agosto</option>
<option>Septiembre</option>
<option>Octubre</option>
<option>Noviembre</option>
<option>Diciembre</option>
</select>

<select onChange={(e)=>setMediator(e.target.value)}>
<option>GLOBAL</option>
<option>742776</option>
<option>755224</option>
<option>742826</option>
</select>

</div>

<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

{fields.map((field)=>(
<label key={field}>

{field}

<input
type="number"
onChange={(e)=>handleChange(field,e.target.value)}
className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
/>

</label>
))}

</div>

<button
type="button"
onClick={handleSubmit}
className="rounded-2xl bg-brand-700 px-5 py-3 font-semibold text-white"
>

Guardar registro

</button>

</form>

</div>

)

}