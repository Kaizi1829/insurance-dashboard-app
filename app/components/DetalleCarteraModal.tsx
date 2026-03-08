"use client"

import {
PieChart,
Pie,
Cell,
ResponsiveContainer,
Tooltip,
Legend
} from "recharts"

export default function DetalleCarteraModal({
title,
data,
colors,
onClose
}:any){

if(!data) return null

return(

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-2xl p-8 w-[600px] relative">

<button
onClick={onClose}
className="absolute right-4 top-4 text-slate-500"
>
✕
</button>

<h2 className="text-xl font-semibold mb-6">
Detalle {title}
</h2>

<div className="h-80">

<ResponsiveContainer width="100%" height="100%">

<PieChart>

<Pie
data={data}
dataKey="value"
nameKey="name"
outerRadius={120}
label={({percent})=>`${(percent*100).toFixed(0)}%`}
>

{data.map((entry:any,index:number)=>(
<Cell key={index} fill={colors[index % colors.length]} />
))}

</Pie>

<Tooltip formatter={(v:number)=>v.toLocaleString("es-ES")+" €"} />

<Legend />

</PieChart>

</ResponsiveContainer>

</div>

</div>

</div>

)

}