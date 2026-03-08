"use client"

type Mode = "min" | "max"

export default function ProgressCard({
  title,
  actual,
  objetivo,
  mode = "min",
  suffix = "€",
}: {
  title: string
  actual: number
  objetivo: number
  mode?: Mode
  suffix?: string
}) {
  const hasObjective = objetivo > 0

  const conseguido = hasObjective
    ? mode === "max"
      ? actual <= objetivo
      : actual >= objetivo
    : false

  let pct = 0

  if (hasObjective) {
    pct = Math.round((actual / objetivo) * 100)
    pct = Math.max(0, Math.min(pct, 100))
  }

  function formatValue(value: number) {
    return `${value.toLocaleString("es-ES")} ${suffix}`
  }

  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex justify-between items-center gap-3 mb-3">
        <p className="font-medium text-sm text-slate-700">{title}</p>

        {hasObjective ? (
          <span
            className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
              conseguido
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {conseguido ? "Conseguido" : "No conseguido"}
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap bg-slate-100 text-slate-500">
            Sin objetivo
          </span>
        )}
      </div>

      <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
        <div
          className={`h-2 ${hasObjective ? "bg-[#003A8F]" : "bg-slate-300"}`}
          style={{ width: `${hasObjective ? pct : 0}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500 gap-4">
        <span className="whitespace-nowrap">Actual: {formatValue(actual)}</span>
        <span className="whitespace-nowrap">Objetivo: {formatValue(objetivo)}</span>
      </div>

      <div className="text-right text-xs text-slate-600 mt-1">
        {hasObjective ? `${pct}%` : "-"}
      </div>
    </div>
  )
}