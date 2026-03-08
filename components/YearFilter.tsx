"use client"

export function YearFilter({year,setYear}:{year:number,setYear:(v:number)=>void}){

return(

<div className="bg-white rounded-2xl p-6 shadow-sm border flex justify-end">

<div className="flex items-center gap-3">

<label className="text-sm text-slate-500">
Año
</label>

<select
value={year}
onChange={(e)=>setYear(Number(e.target.value))}
className="border rounded-lg px-3 py-2"
>

<option value={2026}>2026</option>
<option value={2025}>2025</option>
<option value={2024}>2024</option>

</select>

</div>

</div>

)

}