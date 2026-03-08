"use client"

import { useEffect, useState } from "react"

export default function Objetivos(){

const [year,setYear] = useState(2026)
const [data,setData] = useState<any>(null)



useEffect(()=>{

fetch("/api/objetivos")
.then(res=>res.json())
.then(json=>setData(json))

},[])



function formatMoney(value:number){

if(value === null || value === undefined) return ""

return new Intl.NumberFormat("es-ES").format(value)

}



function parseMoney(value:string){

return Number(value.replace(/\./g,""))

}



function update(section:string,key:string,value:any){

const updated = {...data}

updated[year][section][key] = value

setData(updated)

}



function updateCuatrimestre(c:string,key:string,value:any){

const updated = {...data}

updated[year].rapelCuatrimestral[c][key] = value

setData(updated)

}



async function guardar(){

await fetch("/api/objetivos",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify(data)
})

alert("Objetivos guardados")

}



if(!data) return null

const objetivos = data[year]



return(

<div className="space-y-8">


{/* HEADER */}

<div className="bg-white p-4 rounded-xl border flex justify-between items-center">

<h1 className="text-xl font-semibold text-[#003A8F]">
Configuración de objetivos
</h1>

<select
value={year}
onChange={(e)=>setYear(Number(e.target.value))}
className="border p-2 rounded"
>
<option value={2026}>2026</option>
</select>

</div>



{/* RAPEL ANUAL */}

<div className="bg-white p-4 rounded-xl border space-y-4">

<h2 className="text-[#003A8F] font-semibold">
Rapel anual
</h2>

<div className="grid grid-cols-2 gap-4">

<div>
<p className="text-sm mb-1">Crecimiento mínimo (%)</p>
<input
type="number"
value={objetivos.rapelAnual.crecimientoMin}
onChange={(e)=>update("rapelAnual","crecimientoMin",Number(e.target.value))}
className="border p-2 rounded w-full"
/>
</div>

<div>
<p className="text-sm mb-1">% devueltos máximo (%)</p>
<input
type="number"
value={objetivos.rapelAnual.devolucionesMax}
onChange={(e)=>update("rapelAnual","devolucionesMax",Number(e.target.value))}
className="border p-2 rounded w-full"
/>
</div>

<div>
<p className="text-sm mb-1">Producción Salud (€)</p>
<input
value={formatMoney(objetivos.rapelAnual.saludMin)}
onChange={(e)=>update("rapelAnual","saludMin",parseMoney(e.target.value))}
onBlur={(e)=>update("rapelAnual","saludMin",parseMoney(e.target.value))}
className="border p-2 rounded w-full"
/>
</div>

<div>
<p className="text-sm mb-1">Producción Vida (€)</p>
<input
value={formatMoney(objetivos.rapelAnual.vidaMin)}
onChange={(e)=>update("rapelAnual","vidaMin",parseMoney(e.target.value))}
onBlur={(e)=>update("rapelAnual","vidaMin",parseMoney(e.target.value))}
className="border p-2 rounded w-full"
/>
</div>

</div>

</div>



{/* GRADOS */}

<div className="bg-white p-4 rounded-xl border space-y-4">

<h2 className="text-[#003A8F] font-semibold">
Grados AXA
</h2>

<div className="grid grid-cols-3 gap-4">

{Object.entries(objetivos.grados).map(([key,value]:any)=>(

<div key={key}>

<p className="text-sm mb-1 capitalize">
Grado {key} (€)
</p>

<input
value={formatMoney(value)}
onChange={(e)=>update("grados",key,parseMoney(e.target.value))}
onBlur={(e)=>update("grados",key,parseMoney(e.target.value))}
className="border p-2 rounded w-full"
/>

</div>

))}

</div>

</div>



{/* RAPEL CUATRIMESTRAL */}

<div className="bg-white p-4 rounded-xl border space-y-6">

<h2 className="text-[#003A8F] font-semibold">
Rapel nueva producción
</h2>



{/* 1Q */}

<div>

<p className="font-medium mb-2">
1Q | Enero - Abril
</p>

<div className="grid grid-cols-3 gap-4">

{Object.entries(objetivos.rapelCuatrimestral["1"]).map(([key,value]:any)=>(

<div key={key}>

<p className="text-sm mb-1 capitalize">
{key} (€)
</p>

<input
value={formatMoney(value)}
onChange={(e)=>updateCuatrimestre("1",key,parseMoney(e.target.value))}
onBlur={(e)=>updateCuatrimestre("1",key,parseMoney(e.target.value))}
className="border p-2 rounded w-full"
/>

</div>

))}

</div>

</div>



{/* 2Q */}

<div>

<p className="font-medium mb-2">
2Q | Mayo - Agosto
</p>

<div className="grid grid-cols-3 gap-4">

{Object.entries(objetivos.rapelCuatrimestral["2"]).map(([key,value]:any)=>(

<div key={key}>

<p className="text-sm mb-1 capitalize">
{key} (€)
</p>

<input
value={formatMoney(value)}
onChange={(e)=>updateCuatrimestre("2",key,parseMoney(e.target.value))}
onBlur={(e)=>updateCuatrimestre("2",key,parseMoney(e.target.value))}
className="border p-2 rounded w-full"
/>

</div>

))}

</div>

</div>



{/* 3Q */}

<div>

<p className="font-medium mb-2">
3Q | Septiembre - Diciembre
</p>

<div className="grid grid-cols-3 gap-4">

{Object.entries(objetivos.rapelCuatrimestral["3"]).map(([key,value]:any)=>(

<div key={key}>

<p className="text-sm mb-1 capitalize">
{key} (€)
</p>

<input
value={formatMoney(value)}
onChange={(e)=>updateCuatrimestre("3",key,parseMoney(e.target.value))}
onBlur={(e)=>updateCuatrimestre("3",key,parseMoney(e.target.value))}
className="border p-2 rounded w-full"
/>

</div>

))}

</div>

</div>


</div>



<button
onClick={guardar}
className="bg-[#003A8F] text-white px-6 py-2 rounded"
>
Guardar objetivos
</button>


</div>

)

}