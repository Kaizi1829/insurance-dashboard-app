"use client"

import { useEffect, useMemo, useState } from "react"

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

const monthToNumber: Record<string, number> = {
  Enero: 1,
  Febrero: 2,
  Marzo: 3,
  Abril: 4,
  Mayo: 5,
  Junio: 6,
  Julio: 7,
  Agosto: 8,
  Septiembre: 9,
  Octubre: 10,
  Noviembre: 11,
  Diciembre: 12,
}

const MEDOFIS_BY_YEAR: Record<number, { code: string; label: string }[]> = {
  2020: [
    { code: "GLOBAL", label: "GLOBAL" },
    { code: "742776", label: "742776 - Badajoz" },
    { code: "742821", label: "742821 - Copttraba" },
    { code: "742825", label: "742825 - Madrid" },
    { code: "742826", label: "742826 - Herrera" },
    { code: "742827", label: "742827 - Olivenza" },
  ],
  2021: [
    { code: "GLOBAL", label: "GLOBAL" },
    { code: "742776", label: "742776 - Badajoz" },
    { code: "742821", label: "742821 - Copttraba" },
    { code: "742825", label: "742825 - Madrid" },
    { code: "742826", label: "742826 - Herrera" },
    { code: "742827", label: "742827 - Olivenza" },
  ],
  2022: [
    { code: "GLOBAL", label: "GLOBAL" },
    { code: "742776", label: "742776 - Badajoz" },
    { code: "742821", label: "742821 - Copttraba" },
    { code: "742825", label: "742825 - Madrid" },
    { code: "742826", label: "742826 - Herrera" },
    { code: "742827", label: "742827 - Olivenza" },
  ],
  2023: [
    { code: "GLOBAL", label: "GLOBAL" },
    { code: "742776", label: "742776 - Badajoz" },
    { code: "742821", label: "742821 - Copttraba" },
    { code: "742826", label: "742826 - Herrera" },
    { code: "742827", label: "742827 - Olivenza" },
  ],
  2024: [
    { code: "GLOBAL", label: "GLOBAL" },
    { code: "742776", label: "742776 - Badajoz" },
    { code: "742821", label: "742821 - Copttraba" },
    { code: "742826", label: "742826 - Herrera" },
    { code: "742827", label: "742827 - Olivenza" },
    { code: "755224", label: "755224 - San Roque" },
  ],
  2025: [
    { code: "GLOBAL", label: "GLOBAL" },
    { code: "742776", label: "742776 - Badajoz" },
    { code: "742821", label: "742821 - Copttraba" },
    { code: "742826", label: "742826 - Herrera" },
    { code: "742827", label: "742827 - Olivenza" },
    { code: "755224", label: "755224 - San Roque" },
  ],
  2026: [
    { code: "GLOBAL", label: "GLOBAL" },
    { code: "742776", label: "742776 - Badajoz" },
    { code: "742821", label: "742821 - Copttraba" },
    { code: "742826", label: "742826 - Herrera" },
    { code: "755224", label: "755224 - San Roque" },
  ],
}

const availableYears = Object.keys(MEDOFIS_BY_YEAR)
  .map(Number)
  .sort((a, b) => b - a)

function toNumber(value: any) {
  if (value === undefined || value === null || value === "") return 0

  const v = value.toString().replace("€", "").trim()

  if (v.includes(",")) {
    return parseFloat(v.replace(/\./g, "").replace(",", "."))
  }

  return parseFloat(v)
}

const emptyForm = {
  /* MEDOFIS */
  gwp: "",
  crecimientoPct: "",
  renovacionPct: "",
  tasaNpPct: "",
  cor: "",
  devolucionesPct: "",
  siniestralidadSinIbnrPct: "",

  /* CARTERA - PARTICULARES */
  cartera_auto: "",
  cartera_hogar: "",
  cartera_comunidades: "",
  cartera_decesos: "",
  cartera_rc_part: "",
  cartera_salud_ind: "",
  cartera_part_total: "",

  /* CARTERA - EMPRESA */
  cartera_rc_emp: "",
  cartera_flotas: "",
  cartera_comercio: "",
  cartera_oficina: "",
  cartera_industria: "",
  cartera_transporte: "",
  cartera_emp_total: "",

  /* CARTERA - VIDA */
  cartera_vida_ind: "",
  cartera_ahorro: "",

  /* CARTERA - PSC */
  cartera_vida_col: "",
  cartera_salud_col: "",
  cartera_psc_total: "",

  /* PRODUCCION - PARTICULARES */
  prod_auto: "",
  prod_hogar: "",
  prod_comunidades: "",
  prod_decesos: "",
  prod_rc_part: "",
  prod_salud_ind: "",
  prod_part_total: "",

  /* PRODUCCION - EMPRESA */
  prod_rc_emp: "",
  prod_flotas: "",
  prod_comercio: "",
  prod_oficina: "",
  prod_industria: "",
  prod_transporte: "",
  prod_emp_total: "",

  /* PRODUCCION - VIDA */
  prod_vida_ind: "",
  prod_ahorro: "",

  /* PRODUCCION - PSC */
  prod_vida_col: "",
  prod_salud_col: "",
  prod_psc_total: "",
}

export default function RegistroPage() {
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState("Enero")
  const [mediatorCode, setMediatorCode] = useState("GLOBAL")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<any>(emptyForm)

  const mediators = useMemo(() => {
    return MEDOFIS_BY_YEAR[year] ?? []
  }, [year])

  function updateField(name: string, value: string) {
    setForm((prev: any) => ({
      ...prev,
      [name]: value,
    }))
  }

  useEffect(() => {
    const mediatorExists = mediators.some((m) => m.code === mediatorCode)

    if (!mediatorExists && mediators.length > 0) {
      setMediatorCode(mediators[0].code)
    }
  }, [mediators, mediatorCode])

  useEffect(() => {
    loadExistingData()
  }, [year, month, mediatorCode])

  async function loadExistingData() {
    try {
      setLoading(true)

      const res = await fetch("/api/metrics")
      const data = await res.json()
      const selectedMonthNumber = monthToNumber[month]

      const existing = Array.isArray(data)
        ? data.find(
            (m: any) =>
              Number(m.year) === Number(year) &&
              Number(m.month) === Number(selectedMonthNumber) &&
              (m.mediatorCode === mediatorCode ||
                m.mediator_code === mediatorCode)
          )
        : null

      if (!existing) {
        setForm({ ...emptyForm })
        return
      }

      const nextForm: any = { ...emptyForm }

      /* MEDOFIS */
      nextForm.gwp = existing.medofis?.gwp ?? ""
      nextForm.crecimientoPct = existing.medofis?.crecimientoPct ?? ""
      nextForm.renovacionPct =
        existing.medofis?.renovacionPct ?? existing.medofis?.retencion ?? ""
      nextForm.tasaNpPct = existing.medofis?.tasaNpPct ?? ""
      nextForm.cor = existing.medofis?.cor ?? ""
      nextForm.devolucionesPct = existing.medofis?.devolucionesPct ?? ""
      nextForm.siniestralidadSinIbnrPct =
        existing.medofis?.siniestralidadSinIbnrPct ?? ""

      /* CARTERA - PARTICULARES */
      nextForm.cartera_auto = existing.cartera?.particulares?.auto ?? ""
      nextForm.cartera_hogar = existing.cartera?.particulares?.hogar ?? ""
      nextForm.cartera_comunidades =
        existing.cartera?.particulares?.comunidades ?? ""
      nextForm.cartera_decesos = existing.cartera?.particulares?.decesos ?? ""
      nextForm.cartera_rc_part = existing.cartera?.particulares?.rc ?? ""
      nextForm.cartera_salud_ind = existing.cartera?.particulares?.salud ?? ""
      nextForm.cartera_part_total = existing.cartera?.particulares?.total ?? ""

      /* CARTERA - EMPRESA */
      nextForm.cartera_rc_emp = existing.cartera?.empresa?.rc ?? ""
      nextForm.cartera_flotas = existing.cartera?.empresa?.flotas ?? ""
      nextForm.cartera_comercio = existing.cartera?.empresa?.comercio ?? ""
      nextForm.cartera_oficina = existing.cartera?.empresa?.oficina ?? ""
      nextForm.cartera_industria = existing.cartera?.empresa?.industria ?? ""
      nextForm.cartera_transporte = existing.cartera?.empresa?.transporte ?? ""
      nextForm.cartera_emp_total = existing.cartera?.empresa?.total ?? ""

      /* CARTERA - VIDA */
      nextForm.cartera_vida_ind = existing.cartera?.vida?.individual ?? ""
      nextForm.cartera_ahorro = existing.cartera?.vida?.ahorro ?? ""

      /* CARTERA - PSC */
      nextForm.cartera_vida_col = existing.cartera?.psc?.vida ?? ""
      nextForm.cartera_salud_col = existing.cartera?.psc?.salud ?? ""
      nextForm.cartera_psc_total = existing.cartera?.psc?.total ?? ""

      /* PRODUCCION - PARTICULARES */
      nextForm.prod_auto = existing.produccion?.particulares?.auto ?? ""
      nextForm.prod_hogar = existing.produccion?.particulares?.hogar ?? ""
      nextForm.prod_comunidades =
        existing.produccion?.particulares?.comunidades ?? ""
      nextForm.prod_decesos = existing.produccion?.particulares?.decesos ?? ""
      nextForm.prod_rc_part = existing.produccion?.particulares?.rc ?? ""
      nextForm.prod_salud_ind = existing.produccion?.particulares?.salud ?? ""
      nextForm.prod_part_total = existing.produccion?.particulares?.total ?? ""

      /* PRODUCCION - EMPRESA */
      nextForm.prod_rc_emp = existing.produccion?.empresa?.rc ?? ""
      nextForm.prod_flotas = existing.produccion?.empresa?.flotas ?? ""
      nextForm.prod_comercio = existing.produccion?.empresa?.comercio ?? ""
      nextForm.prod_oficina = existing.produccion?.empresa?.oficina ?? ""
      nextForm.prod_industria = existing.produccion?.empresa?.industria ?? ""
      nextForm.prod_transporte = existing.produccion?.empresa?.transporte ?? ""
      nextForm.prod_emp_total = existing.produccion?.empresa?.total ?? ""

      /* PRODUCCION - VIDA */
      nextForm.prod_vida_ind = existing.produccion?.vida?.individual ?? ""
      nextForm.prod_ahorro = existing.produccion?.vida?.ahorro ?? ""

      /* PRODUCCION - PSC */
      nextForm.prod_vida_col = existing.produccion?.psc?.vida ?? ""
      nextForm.prod_salud_col = existing.produccion?.psc?.salud ?? ""
      nextForm.prod_psc_total = existing.produccion?.psc?.total ?? ""

      setForm(nextForm)
    } catch (error) {
      console.error("Error cargando ARGOS:", error)
      setForm({ ...emptyForm })
    } finally {
      setLoading(false)
    }
  }

  async function guardar() {
    try {
      setSaving(true)

      const payload = {
        year,
        month: monthToNumber[month],
        mediatorCode,

        medofis: {
          gwp: toNumber(form.gwp),
          crecimientoPct: toNumber(form.crecimientoPct),
          renovacionPct: toNumber(form.renovacionPct),
          tasaNpPct: toNumber(form.tasaNpPct),
          cor: toNumber(form.cor),
          devolucionesPct: toNumber(form.devolucionesPct),
          siniestralidadSinIbnrPct: toNumber(form.siniestralidadSinIbnrPct),
        },

        cartera: {
          particulares: {
            auto: toNumber(form.cartera_auto),
            hogar: toNumber(form.cartera_hogar),
            comunidades: toNumber(form.cartera_comunidades),
            decesos: toNumber(form.cartera_decesos),
            rc: toNumber(form.cartera_rc_part),
            salud: toNumber(form.cartera_salud_ind),
            total: toNumber(form.cartera_part_total),
          },

          empresa: {
            rc: toNumber(form.cartera_rc_emp),
            flotas: toNumber(form.cartera_flotas),
            comercio: toNumber(form.cartera_comercio),
            oficina: toNumber(form.cartera_oficina),
            industria: toNumber(form.cartera_industria),
            transporte: toNumber(form.cartera_transporte),
            total: toNumber(form.cartera_emp_total),
          },

          vida: {
            individual: toNumber(form.cartera_vida_ind),
            ahorro: toNumber(form.cartera_ahorro),
          },

          psc: {
            vida: toNumber(form.cartera_vida_col),
            salud: toNumber(form.cartera_salud_col),
            total: toNumber(form.cartera_psc_total),
          },
        },

        produccion: {
          particulares: {
            auto: toNumber(form.prod_auto),
            hogar: toNumber(form.prod_hogar),
            comunidades: toNumber(form.prod_comunidades),
            decesos: toNumber(form.prod_decesos),
            rc: toNumber(form.prod_rc_part),
            salud: toNumber(form.prod_salud_ind),
            total: toNumber(form.prod_part_total),
          },

          empresa: {
            rc: toNumber(form.prod_rc_emp),
            flotas: toNumber(form.prod_flotas),
            comercio: toNumber(form.prod_comercio),
            oficina: toNumber(form.prod_oficina),
            industria: toNumber(form.prod_industria),
            transporte: toNumber(form.prod_transporte),
            total: toNumber(form.prod_emp_total),
          },

          vida: {
            individual: toNumber(form.prod_vida_ind),
            ahorro: toNumber(form.prod_ahorro),
          },

          psc: {
            vida: toNumber(form.prod_vida_col),
            salud: toNumber(form.prod_salud_col),
            total: toNumber(form.prod_psc_total),
          },
        },
      }

      const res = await fetch("/api/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error("No se pudo guardar el registro")
      }

      alert("ARGOS guardado")
      window.dispatchEvent(new Event("metricsUpdated"))
      await loadExistingData()
    } catch (error) {
      console.error(error)
      alert("Ha habido un error al guardar el ARGOS")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Registro ARGOS</h1>
        <p className="mt-1 text-sm text-slate-500">
          Alta y edición mensual de indicadores, cartera y producción
        </p>
      </div>

      <div className="panel grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-slate-600">
          Año
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          >
            {availableYears.map((itemYear) => (
              <option key={itemYear} value={itemYear}>
                {itemYear}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-600">
          Mes
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-600">
          Mediador
          <select
            value={mediatorCode}
            onChange={(e) => setMediatorCode(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          >
            {mediators.map((m) => (
              <option key={m.code} value={m.code}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="panel text-sm text-slate-500">
          Cargando datos del registro...
        </div>
      ) : null}

      <Section title="Indicadores Medofis" defaultOpen>
        <Input label="GWP" name="gwp" value={form.gwp} update={updateField} />
        <Input
          label="% Crecimiento"
          name="crecimientoPct"
          value={form.crecimientoPct}
          update={updateField}
        />
        <Input
          label="Renovación %"
          name="renovacionPct"
          value={form.renovacionPct}
          update={updateField}
        />
        <Input
          label="Tasa NP %"
          name="tasaNpPct"
          value={form.tasaNpPct}
          update={updateField}
        />
        <Input label="COR" name="cor" value={form.cor} update={updateField} />
        <Input
          label="% Devueltos"
          name="devolucionesPct"
          value={form.devolucionesPct}
          update={updateField}
        />
        <Input
          label="Siniestralidad sin IBNR %"
          name="siniestralidadSinIbnrPct"
          value={form.siniestralidadSinIbnrPct}
          update={updateField}
        />
      </Section>

      <Section title="Cartera (GWP)" defaultOpen>
        <SubSection title="Particulares">
          <Input
            label="Auto"
            name="cartera_auto"
            value={form.cartera_auto}
            update={updateField}
          />
          <Input
            label="Hogar"
            name="cartera_hogar"
            value={form.cartera_hogar}
            update={updateField}
          />
          <Input
            label="Comunidades"
            name="cartera_comunidades"
            value={form.cartera_comunidades}
            update={updateField}
          />
          <Input
            label="Decesos"
            name="cartera_decesos"
            value={form.cartera_decesos}
            update={updateField}
          />
          <Input
            label="RC Particulares"
            name="cartera_rc_part"
            value={form.cartera_rc_part}
            update={updateField}
          />
          <Input
            label="Salud Individual"
            name="cartera_salud_ind"
            value={form.cartera_salud_ind}
            update={updateField}
          />
          <Input
            label="Total Particulares"
            name="cartera_part_total"
            value={form.cartera_part_total}
            update={updateField}
          />
        </SubSection>

        <SubSection title="Empresa">
          <Input
            label="RC"
            name="cartera_rc_emp"
            value={form.cartera_rc_emp}
            update={updateField}
          />
          <Input
            label="Flotas"
            name="cartera_flotas"
            value={form.cartera_flotas}
            update={updateField}
          />
          <Input
            label="Comercio"
            name="cartera_comercio"
            value={form.cartera_comercio}
            update={updateField}
          />
          <Input
            label="Oficina"
            name="cartera_oficina"
            value={form.cartera_oficina}
            update={updateField}
          />
          <Input
            label="Industria"
            name="cartera_industria"
            value={form.cartera_industria}
            update={updateField}
          />
          <Input
            label="Transporte"
            name="cartera_transporte"
            value={form.cartera_transporte}
            update={updateField}
          />
          <Input
            label="Total Empresa"
            name="cartera_emp_total"
            value={form.cartera_emp_total}
            update={updateField}
          />
        </SubSection>

        <SubSection title="Vida">
          <Input
            label="Vida Individual"
            name="cartera_vida_ind"
            value={form.cartera_vida_ind}
            update={updateField}
          />
          <Input
            label="Ahorro"
            name="cartera_ahorro"
            value={form.cartera_ahorro}
            update={updateField}
          />
        </SubSection>

        <SubSection title="PSC">
          <Input
            label="Vida Colectivo"
            name="cartera_vida_col"
            value={form.cartera_vida_col}
            update={updateField}
          />
          <Input
            label="Salud Colectivo"
            name="cartera_salud_col"
            value={form.cartera_salud_col}
            update={updateField}
          />
          <Input
            label="Total PSC"
            name="cartera_psc_total"
            value={form.cartera_psc_total}
            update={updateField}
          />
        </SubSection>
      </Section>

      <Section title="Producción (GWPNP)" defaultOpen={false}>
        <SubSection title="Particulares">
          <Input
            label="Auto"
            name="prod_auto"
            value={form.prod_auto}
            update={updateField}
          />
          <Input
            label="Hogar"
            name="prod_hogar"
            value={form.prod_hogar}
            update={updateField}
          />
          <Input
            label="Comunidades"
            name="prod_comunidades"
            value={form.prod_comunidades}
            update={updateField}
          />
          <Input
            label="Decesos"
            name="prod_decesos"
            value={form.prod_decesos}
            update={updateField}
          />
          <Input
            label="RC Particulares"
            name="prod_rc_part"
            value={form.prod_rc_part}
            update={updateField}
          />
          <Input
            label="Salud Individual"
            name="prod_salud_ind"
            value={form.prod_salud_ind}
            update={updateField}
          />
          <Input
            label="Total Particulares"
            name="prod_part_total"
            value={form.prod_part_total}
            update={updateField}
          />
        </SubSection>

        <SubSection title="Empresa">
          <Input
            label="RC"
            name="prod_rc_emp"
            value={form.prod_rc_emp}
            update={updateField}
          />
          <Input
            label="Flotas"
            name="prod_flotas"
            value={form.prod_flotas}
            update={updateField}
          />
          <Input
            label="Comercio"
            name="prod_comercio"
            value={form.prod_comercio}
            update={updateField}
          />
          <Input
            label="Oficina"
            name="prod_oficina"
            value={form.prod_oficina}
            update={updateField}
          />
          <Input
            label="Industria"
            name="prod_industria"
            value={form.prod_industria}
            update={updateField}
          />
          <Input
            label="Transporte"
            name="prod_transporte"
            value={form.prod_transporte}
            update={updateField}
          />
          <Input
            label="Total Empresa"
            name="prod_emp_total"
            value={form.prod_emp_total}
            update={updateField}
          />
        </SubSection>

        <SubSection title="Vida">
          <Input
            label="Vida Individual"
            name="prod_vida_ind"
            value={form.prod_vida_ind}
            update={updateField}
          />
          <Input
            label="Ahorro"
            name="prod_ahorro"
            value={form.prod_ahorro}
            update={updateField}
          />
        </SubSection>

        <SubSection title="PSC">
          <Input
            label="Vida Colectivo"
            name="prod_vida_col"
            value={form.prod_vida_col}
            update={updateField}
          />
          <Input
            label="Salud Colectivo"
            name="prod_salud_col"
            value={form.prod_salud_col}
            update={updateField}
          />
          <Input
            label="Total PSC"
            name="prod_psc_total"
            value={form.prod_psc_total}
            update={updateField}
          />
        </SubSection>
      </Section>

      <div className="flex items-center gap-4">
        <button
          onClick={guardar}
          disabled={saving}
          className="rounded-2xl bg-[#003A8F] px-6 py-3 font-semibold text-white disabled:opacity-70"
        >
          {saving ? "Guardando..." : "Guardar ARGOS"}
        </button>

        <button
          type="button"
          onClick={loadExistingData}
          className="rounded-2xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700"
        >
          Recargar datos
        </button>
      </div>
    </div>
  )
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

      <div className="space-y-6 border-t border-slate-100 px-6 py-6">
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
    <details
      className="rounded-2xl border border-slate-200 bg-slate-50/60"
      open
    >
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

function Input({
  label,
  value,
  name,
  update,
}: {
  label: string
  value: string | number
  name: string
  update: (name: string, value: string) => void
}) {
  return (
    <label className="text-sm font-medium text-slate-600">
      {label}
      <input
        value={value ?? ""}
        onChange={(e) => update(name, e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
      />
    </label>
  )
}