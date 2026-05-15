"use client"

import { useEffect, useState } from "react"

const years = [2024, 2025, 2026, 2027]

export default function Objetivos() {
  const [year, setYear] = useState(2026)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    cargarObjetivos(year)
  }, [year])

  async function cargarObjetivos(selectedYear: number) {
    try {
      const res = await fetch(`/api/objetivos?year=${selectedYear}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error("Error cargando objetivos:", error)
      setData(null)
    }
  }

  function formatMoney(value: number) {
    if (value === null || value === undefined) return ""
    return new Intl.NumberFormat("es-ES").format(value)
  }

  if (!data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Configuración de objetivos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configuración anual de grados AXA y rapeles
          </p>
        </div>

        <div className="panel text-sm text-slate-500">
          Cargando objetivos...
        </div>
      </div>
    )
  }

  const objetivos = data

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configuración de objetivos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configuración anual de grados AXA y rapeles
        </p>
      </div>

      <div className="panel grid gap-4 md:grid-cols-1">
        <label className="text-sm font-medium text-slate-600">
          Año
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Section title="Rapel anual" defaultOpen>
        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyInput
            label="Crecimiento mínimo (%)"
            value={objetivos.rapelAnual?.crecimientoMin}
          />

          <ReadOnlyInput
            label="% devueltos máximo (%)"
            value={objetivos.rapelAnual?.devolucionesMax}
          />

          <ReadOnlyInput
            label="Producción Salud (€)"
            value={formatMoney(objetivos.rapelAnual?.saludMin ?? 0)}
          />

          <ReadOnlyInput
            label="Producción Vida (€)"
            value={formatMoney(objetivos.rapelAnual?.vidaMin ?? 0)}
          />
        </div>
      </Section>

      <Section title="Grados AXA" defaultOpen>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(objetivos.grados ?? {}).map(([key, value]: any) => (
            <ReadOnlyInput
              key={key}
              label={`Grado ${prettyLabel(key)} (€)`}
              value={formatMoney(value)}
            />
          ))}
        </div>
      </Section>

      <Section title="Rapel nueva producción" defaultOpen>
        <SubSection title="1Q | Enero - Abril">
          {Object.entries(objetivos.rapelCuatrimestral?.["1"] ?? {}).map(
            ([key, value]: any) => (
              <ReadOnlyInput
                key={key}
                label={`${prettyLabel(key)} (€)`}
                value={formatMoney(value)}
              />
            )
          )}
        </SubSection>

        <SubSection title="2Q | Mayo - Agosto">
          {Object.entries(objetivos.rapelCuatrimestral?.["2"] ?? {}).map(
            ([key, value]: any) => (
              <ReadOnlyInput
                key={key}
                label={`${prettyLabel(key)} (€)`}
                value={formatMoney(value)}
              />
            )
          )}
        </SubSection>

        <SubSection title="3Q | Septiembre - Diciembre">
          {Object.entries(objetivos.rapelCuatrimestral?.["3"] ?? {}).map(
            ([key, value]: any) => (
              <ReadOnlyInput
                key={key}
                label={`${prettyLabel(key)} (€)`}
                value={formatMoney(value)}
              />
            )
          )}
        </SubSection>
      </Section>

      <div className="panel text-sm text-slate-500">
        Los objetivos se configuran directamente en el código de la aplicación.
      </div>
    </div>
  )
}

function prettyLabel(value: string) {
  const labels: Record<string, string> = {
    salud: "Salud",
    vida: "Vida",
    psc: "PSC",
    empresa: "Empresa",
    ahorro: "Ahorro",
    particulares: "Particulares",
  }

  return labels[value] ?? value.charAt(0).toUpperCase() + value.slice(1)
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details
      open={defaultOpen}
      className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-panel"
    >
      <summary className="cursor-pointer list-none px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <span className="text-sm text-slate-400">Abrir / cerrar</span>
        </div>
      </summary>

      <div className="border-t border-slate-100 px-6 py-6 space-y-6">
        {children}
      </div>
    </details>
  )
}

function SubSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-slate-50/60" open>
      <summary className="cursor-pointer list-none px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <h4 className="font-semibold text-slate-800">{title}</h4>
          <span className="text-xs text-slate-400">Desplegar</span>
        </div>
      </summary>

      <div className="border-t border-slate-200 px-4 py-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {children}
        </div>
      </div>
    </details>
  )
}

function ReadOnlyInput({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <label className="text-sm font-medium text-slate-600">
      {label}
      <input
        value={value ?? ""}
        readOnly
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
      />
    </label>
  )
}