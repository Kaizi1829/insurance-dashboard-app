"use client"

import {
PieChart,
Pie,
Cell,
ResponsiveContainer,
Tooltip,
Legend
} from "recharts"

const COLORS = [
"#F6D88A", // Particulares
"#9CC3FF", // Empresa
"#9FE3B0", // Salud
"#F6A6A6", // Vida
"#C8A2FF"  // Ahorro
]

function renderLabel({ name, percent }: any) {

if (percent < 0.03) return ""

return `${(percent * 100).toFixed(0)}%`

}

export function CarteraChart({ data }: { data: any }) {

return (

<ResponsiveContainer width="100%" height={340}>

<PieChart>

<Pie
data={data}
dataKey="value"
nameKey="name"
cx="50%"
cy="50%"
outerRadius={115}
innerRadius={45}
paddingAngle={3}
labelLine={false}
label={renderLabel}
>

{data.map((entry: any, index: number) => (

<Cell
key={`cell-${index}`}
fill={COLORS[index % COLORS.length]}
/>

))}

</Pie>

<Tooltip
formatter={(value: any) =>
`${value.toLocaleString("es-ES")} €`
}
/>

<Legend
verticalAlign="bottom"
height={36}
/>

</PieChart>

</ResponsiveContainer>

)

}



export function ProduccionChart({ data }: { data: any }) {

return (

<ResponsiveContainer width="100%" height={340}>

<PieChart>

<Pie
data={data}
dataKey="value"
nameKey="name"
cx="50%"
cy="50%"
outerRadius={115}
innerRadius={45}
paddingAngle={3}
labelLine={false}
label={renderLabel}
>

{data.map((entry: any, index: number) => (

<Cell
key={`cell-${index}`}
fill={COLORS[index % COLORS.length]}
/>

))}

</Pie>

<Tooltip
formatter={(value: any) =>
`${value.toLocaleString("es-ES")} €`
}
/>

<Legend
verticalAlign="bottom"
height={36}
/>

</PieChart>

</ResponsiveContainer>

)

}
