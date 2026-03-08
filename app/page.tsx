"use client"

import { useEffect, useState } from "react"
import {
  BadgeEuro,
  ShieldCheck,
  TrendingUp,
  Percent,
  ArrowUpRight,
  Target,
  Award,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

import ProgressCard from "./components/ProgressCard"

/* COLORES */

const COLORS = ["#F6D88A", "#9CC3FF", "#9FE3B0", "#F6A6A6", "#C8A2FF"]

/* UTILIDAD NÚMEROS */

function toNumber(value: any) {
  if (value === undefined || value === null || value === "") return 0
  if (typeof value === "number") return value

  let str = value.toString().trim().replace("€", "").replace(/\s/g, "")

  const hasComma = str.includes(",")
  const hasDot = str.includes(".")

  if (hasComma && hasDot) {
    str = str.replace(/\./g, "").replace(",", ".")
  } else if (hasComma) {
    str = str.replace(",", ".")
  }

  str = str.replace(/[^0-9.-]/g, "")

  return Number(str) || 0
}

/* LABEL DEL GRÁFICO */

function percentLabel({ percent }: any) {
  if (percent < 0.03) return ""
  return `${(percent * 100).toFixed(0)}%`
}

export default function HomePage() {
  const [year, setYear] = useState(2026)
  const [data, setData] = useState<any>(null)
  const [years, setYears] = useState<number[]>([])
  const [objetivos, setObjetivos] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/metrics").then((r) => r.json()),
      fetch("/api/objetivos").then((r) => r.json()).catch(() => ({})),
    ]).then(([metrics, obj]) => {
      if (!Array.isArray(metrics)) return

      const availableYears = [...new Set(metrics.map((m: any) => Number(m.year)))]
        .filter((y) => !Number.isNaN(y))
        .sort((a, b) => b - a)

      setYears(availableYears)

      const months = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ]

      const filtered = metrics
        .filter((m: any) => Number(m.year) === year && m.mediatorCode === "GLOBAL")
        .sort((a: any, b: any) => months.indexOf(a.month) - months.indexOf(b.month))

      if (filtered.length > 0) {
        setData(filtered[filtered.length - 1])
      } else {
        setData(null)
      }

      setObjetivos(obj?.[year] || null)
    })
  }, [year])

  if (!data) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-2xl p-6 border flex justify-between">
          <div>
            <h1 className="text-2xl font-bold">Home</h1>
            <p className="text-sm text-slate-500">Panel ejecutivo de la agencia</p>
          </div>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-lg px-3 py-2"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white border rounded-2xl p-10 text-center text-slate-400">
          No hay datos para este año
        </div>
      </div>
    )
  }

  /* KPIs */

  const renovacion = toNumber(data?.medofis?.renovacionPct)
  const tasaNP = toNumber(data?.medofis?.tasaNpPct)
  const crecimiento = toNumber(data?.medofis?.crecimientoPct)
  const cor = toNumber(data?.medofis?.cor)
  const devoluciones = toNumber(data?.medofis?.devolucionesPct)

  /* PRODUCCIÓN */

  const auto = toNumber(data?.produccion?.particulares?.auto)
  const hogar = toNumber(data?.produccion?.particulares?.hogar)
  const comunidades = toNumber(data?.produccion?.particulares?.comunidades)
  const decesos = toNumber(data?.produccion?.particulares?.decesos)
  const rcPart = toNumber(data?.produccion?.particulares?.rc)
  const saludInd = toNumber(data?.produccion?.particulares?.salud)

  const rcEmp = toNumber(data?.produccion?.empresa?.rc)
  const flotas = toNumber(data?.produccion?.empresa?.flotas)
  const comercio = toNumber(data?.produccion?.empresa?.comercio)
  const oficina = toNumber(data?.produccion?.empresa?.oficina)
  const industria = toNumber(data?.produccion?.empresa?.industria)
  const transporte = toNumber(data?.produccion?.empresa?.transporte)

  const vidaInd = toNumber(data?.produccion?.vida?.individual)
  const ahorro = toNumber(data?.produccion?.vida?.ahorro)

  const vidaCol = toNumber(data?.produccion?.psc?.vida)
  const saludCol = toNumber(data?.produccion?.psc?.salud)

  /* TOTALES PRODUCCIÓN */

  const prodParticulares =
    auto + hogar + comunidades + decesos + rcPart + saludInd

  const prodEmpresa =
    rcEmp + flotas + comercio + oficina + industria + transporte

  const prodPSC = vidaCol + saludCol
  const prodSalud = saludInd + saludCol

  /* CARTERA */

  const carteraData = [
    { name: "Particulares", value: toNumber(data?.cartera?.particulares?.total) },
    { name: "Empresa", value: toNumber(data?.cartera?.empresa?.total) },
    { name: "Vida", value: toNumber(data?.cartera?.vida?.individual) },
    { name: "Ahorro", value: toNumber(data?.cartera?.vida?.ahorro) },
    { name: "PSC", value: toNumber(data?.cartera?.psc?.total) },
  ]

  /* OBJETIVOS */

  const objRapel = objetivos?.rapelAnual || {
    crecimientoMin: 0,
    devolucionesMax: 2,
    saludMin: 8000,
    vidaMin: 8000,
  }

  const objGrados = objetivos?.grados || {
    salud: 20000,
    empresa: 40000,
    vida: 12000,
    ahorro: 100000,
    psc: 12000,
  }

  const objetivosQ1 = objetivos?.rapelCuatrimestral?.["1"] || {
    salud: 0,
    psc: 0,
    empresa: 0,
    particulares: 0,
    ahorro: 0,
    vida: 0,
  }

  const objetivosQ2 = objetivos?.rapelCuatrimestral?.["2"] || {
    salud: 0,
    psc: 0,
    empresa: 0,
    particulares: 0,
    ahorro: 0,
    vida: 0,
  }

  const objetivosQ3 = objetivos?.rapelCuatrimestral?.["3"] || {
    salud: 0,
    psc: 0,
    empresa: 0,
    particulares: 0,
    ahorro: 0,
    vida: 0,
  }

  return (
    <div className="space-y-10">
      {/* HEADER */}

      <div className="bg-white rounded-2xl p-6 border flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Home</h1>
          <p className="text-slate-500 text-sm">Panel ejecutivo de la agencia</p>
        </div>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded-lg px-3 py-2"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* KPIS */}

      <section className="grid md:grid-cols-2 xl:grid-cols-5 gap-6">
        <Kpi
          title="GWP"
          value={toNumber(data?.medofis?.gwp).toLocaleString("es-ES") + " €"}
          raw={0}
          icon={BadgeEuro}
        />

        <Kpi
          title="Renovación"
          value={renovacion.toLocaleString("es-ES", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }) + "%"}
          raw={renovacion}
          icon={ShieldCheck}
        />

        <Kpi
          title="Tasa NP"
          value={tasaNP.toLocaleString("es-ES", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }) + "%"}
          raw={tasaNP}
          icon={TrendingUp}
        />

        <Kpi
          title="% GWP"
          value={crecimiento.toLocaleString("es-ES", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }) + "%"}
          raw={crecimiento}
          icon={Percent}
        />

        <Kpi
          title="COR"
          value={cor.toLocaleString("es-ES", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }) + "%"}
          raw={cor}
          icon={ArrowUpRight}
        />
      </section>

      {/* CARTERA + PRODUCCION */}

      <section className="grid xl:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl p-6 border xl:col-span-1">
          <h3 className="font-semibold mb-4">Composición de cartera</h3>

          <div className="h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={carteraData}
                  dataKey="value"
                  outerRadius={110}
                  innerRadius={50}
                  label={percentLabel}
                  labelLine={false}
                >
                  {carteraData.map((e, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>

                <Tooltip formatter={(v: number) => v.toLocaleString("es-ES") + " €"} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border xl:col-span-2">
          <h3 className="font-semibold mb-4">Análisis de producción</h3>

          <div className="grid md:grid-cols-4 gap-8">
            <Prod
              title="Particulares"
              data={[
                ["Auto", auto],
                ["Hogar", hogar],
                ["Comunidades", comunidades],
                ["Decesos", decesos],
                ["RC", rcPart],
                ["Salud Individual", saludInd],
              ]}
            />

            <Prod
              title="Empresa"
              data={[
                ["RC", rcEmp],
                ["Flotas", flotas],
                ["Comercio", comercio],
                ["Oficina", oficina],
                ["Industria", industria],
                ["Transporte", transporte],
              ]}
            />

            <Prod
              title="Vida"
              data={[
                ["Vida Individual", vidaInd],
                ["Ahorro", ahorro],
              ]}
            />

            <Prod
              title="PSC"
              data={[
                ["Vida Colectivo", vidaCol],
                ["Salud Colectivo", saludCol],
              ]}
            />
          </div>
        </div>
      </section>

      {/* RAPEL ANUAL */}

      <details className="bg-white rounded-2xl border" open>
        <summary className="cursor-pointer p-6 font-semibold flex gap-2 items-center">
          <Target size={18} />
          Rapel anual
        </summary>

        <div className="p-6 pt-0 grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          <ProgressCard
            title="Crecimiento mínimo"
            actual={crecimiento}
            objetivo={toNumber(objRapel.crecimientoMin)}
            mode="min"
            suffix="%"
          />

          <ProgressCard
            title="% devueltos máximo"
            actual={devoluciones}
            objetivo={toNumber(objRapel.devolucionesMax)}
            mode="max"
            suffix="%"
          />

          <ProgressCard
            title="Producción Salud"
            actual={prodSalud}
            objetivo={toNumber(objRapel.saludMin)}
          />

          <ProgressCard
            title="Producción Vida"
            actual={vidaInd}
            objetivo={toNumber(objRapel.vidaMin)}
          />
        </div>
      </details>

      {/* GRADOS */}

      <details className="bg-white rounded-2xl border">
        <summary className="cursor-pointer p-6 font-semibold flex gap-2 items-center">
          <Award size={18} />
          Grados AXA
        </summary>

        <div className="p-6 pt-0 grid md:grid-cols-2 xl:grid-cols-5 gap-6">
          <ProgressCard
            title="Grado Salud"
            actual={prodSalud}
            objetivo={toNumber(objGrados.salud)}
          />

          <ProgressCard
            title="Grado Empresa"
            actual={prodEmpresa}
            objetivo={toNumber(objGrados.empresa)}
          />

          <ProgressCard
            title="Grado Vida"
            actual={vidaInd}
            objetivo={toNumber(objGrados.vida)}
          />

          <ProgressCard
            title="Grado Ahorro"
            actual={ahorro}
            objetivo={toNumber(objGrados.ahorro)}
          />

          <ProgressCard
            title="Grado PSC"
            actual={prodPSC}
            objetivo={toNumber(objGrados.psc)}
          />
        </div>
      </details>

      {/* RAPEL CUATRIMESTRAL */}

      <details className="bg-white rounded-2xl border">
        <summary className="cursor-pointer p-6 font-semibold flex gap-2 items-center">
          <Target size={18} />
          Seguimiento Rapel Cuatrimestral
        </summary>

        <div className="p-6 pt-0 space-y-8">
          <div>
            <h4 className="font-semibold text-slate-700 mb-4">1Q | Enero - Abril</h4>

            <div className="grid md:grid-cols-2 xl:grid-cols-6 gap-6">
              <ProgressCard title="Salud" actual={prodSalud} objetivo={toNumber(objetivosQ1.salud)} />
              <ProgressCard title="PSC" actual={prodPSC} objetivo={toNumber(objetivosQ1.psc)} />
              <ProgressCard title="Empresa" actual={prodEmpresa} objetivo={toNumber(objetivosQ1.empresa)} />
              <ProgressCard title="Particulares" actual={prodParticulares} objetivo={toNumber(objetivosQ1.particulares)} />
              <ProgressCard title="Ahorro" actual={ahorro} objetivo={toNumber(objetivosQ1.ahorro)} />
              <ProgressCard title="Vida" actual={vidaInd} objetivo={toNumber(objetivosQ1.vida)} />
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-700 mb-4">2Q | Mayo - Agosto</h4>

            <div className="grid md:grid-cols-2 xl:grid-cols-6 gap-6">
              <ProgressCard title="Salud" actual={prodSalud} objetivo={toNumber(objetivosQ2.salud)} />
              <ProgressCard title="PSC" actual={prodPSC} objetivo={toNumber(objetivosQ2.psc)} />
              <ProgressCard title="Empresa" actual={prodEmpresa} objetivo={toNumber(objetivosQ2.empresa)} />
              <ProgressCard title="Particulares" actual={prodParticulares} objetivo={toNumber(objetivosQ2.particulares)} />
              <ProgressCard title="Ahorro" actual={ahorro} objetivo={toNumber(objetivosQ2.ahorro)} />
              <ProgressCard title="Vida" actual={vidaInd} objetivo={toNumber(objetivosQ2.vida)} />
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-700 mb-4">3Q | Septiembre - Diciembre</h4>

            <div className="grid md:grid-cols-2 xl:grid-cols-6 gap-6">
              <ProgressCard title="Salud" actual={prodSalud} objetivo={toNumber(objetivosQ3.salud)} />
              <ProgressCard title="PSC" actual={prodPSC} objetivo={toNumber(objetivosQ3.psc)} />
              <ProgressCard title="Empresa" actual={prodEmpresa} objetivo={toNumber(objetivosQ3.empresa)} />
              <ProgressCard title="Particulares" actual={prodParticulares} objetivo={toNumber(objetivosQ3.particulares)} />
              <ProgressCard title="Ahorro" actual={ahorro} objetivo={toNumber(objetivosQ3.ahorro)} />
              <ProgressCard title="Vida" actual={vidaInd} objetivo={toNumber(objetivosQ3.vida)} />
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}

/* KPI CARD */

function Kpi({ title, value, raw, icon: Icon }: any) {
  function color() {
    if (title === "Renovación") {
      if (raw < 70) return "text-red-600"
      if (raw <= 90) return "text-orange-500"
      return "text-green-600"
    }

    if (title === "Tasa NP") {
      if (raw < 10) return "text-red-600"
      if (raw < 15) return "text-orange-500"
      return "text-green-600"
    }

    if (title === "% GWP") {
      if (raw < 0) return "text-red-600"
      if (raw <= 5) return "text-orange-500"
      return "text-green-600"
    }

    if (title === "COR") {
      if (raw > 100) return "text-red-600"
      return "text-green-600"
    }

    return "text-[#003A8F]"
  }

  return (
    <div className="bg-white rounded-2xl p-6 border">
      <div className="flex justify-between mb-2">
        <p className="text-sm text-slate-500">{title}</p>
        <Icon size={20} className="text-[#003A8F]" />
      </div>

      <p className={`text-2xl font-bold ${color()}`}>{value}</p>
    </div>
  )
}

/* PRODUCCION */

function Prod({ title, data }: any) {
  return (
    <div>
      <h4 className="font-semibold mb-2">{title}</h4>

      <div className="space-y-1">
        {data.map((d: any) => (
          <div key={d[0]} className="flex justify-between">
            <span>{d[0]}</span>
            <span className="font-semibold text-[#003A8F]">
              {d[1].toLocaleString("es-ES")} €
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}