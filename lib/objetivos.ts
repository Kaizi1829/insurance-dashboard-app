// ─── Tablas de rapel 2026 (extraídas del contrato firmado) ────────────────────

export type TramoRapel = { min: number; max: number; pct: number }

export const RAPEL_TABLAS_2026: Record<string, TramoRapel[]> = {
  saludInd: [
    { min: 6,   max: 7,        pct: 0.50 },
    { min: 7,   max: 8,        pct: 1.00 },
    { min: 8,   max: Infinity, pct: 1.50 },
  ],
  particulares: [
    { min: 5,   max: 6,        pct: 0.20 },
    { min: 6,   max: 7.5,      pct: 0.40 },
    { min: 7.5, max: Infinity, pct: 0.55 },
  ],
  empresas: [
    { min: 4.5, max: 6,        pct: 0.50 },
    { min: 6,   max: 7,        pct: 1.00 },
    { min: 7,   max: Infinity, pct: 1.50 },
  ],
  psc: [
    { min: 25,  max: 35,       pct: 0.75 },
    { min: 35,  max: 50,       pct: 1.50 },
    { min: 50,  max: Infinity, pct: 2.30 },
  ],
}

// Tabla TNP para parte B (extraída del contrato firmado)
export const RAPEL_TNP_2026: TramoRapel[] = [
  { min: 15,   max: Infinity, pct: 100 }, // 100% del componente B
  { min: 12.5, max: 15,       pct: 70  }, // 70% del componente B
  { min: 0,    max: 12.5,     pct: 0   }, // 0%
]

// Factor TNP: qué % del componente B se devenga según la TNP de la agencia
export function factorTNP(tnpPct: number): number {
  const tramo = [...RAPEL_TNP_2026].reverse().find(t => tnpPct >= t.min)
  return tramo ? tramo.pct / 100 : 0
}

// Calcula el devengo de un bloque dado su GWP y % de crecimiento
// Devuelve: devengo_A (70% component) y el devengo total potencial (para calcular B)
export function calcDevengoBloqueA(
  gwpActual: number,
  crecPct: number,
  tabla: TramoRapel[]
): { tramo: TramoRapel | null; devengo: number; devengoPotencial: number } {
  const tramo = tabla.findLast(t => crecPct >= t.min) ?? null
  const devengoPotencial = tramo ? gwpActual * (tramo.pct / 100) : 0
  return { tramo, devengo: devengoPotencial * 0.70, devengoPotencial }
}

// Condiciones mínimas de devengo 2026
export const CONDICIONES_2026 = {
  crecimientoIARDMin: 0,   // GWP total IARD > 0%
  corMax:            100,  // CoR descrestado < 100%
  pendienteMax:        2,  // % pendiente < 2%
  vidaRiesgoMin:    8000,  // GWPNP Vida Riesgo ≥ 8.000€
  saludMin:         8000,  // GWPNP Salud ≥ 8.000€
  devengMin:        1000,  // mínimo para cobrar
  devengMax:      125000,  // máximo total (incluyendo cuatrimestral)
  aceleradorMax:    5000,  // +10% por mejora segmentación, max 5.000€
}

// Objetivos por año
export const objetivosPorAno: Record<number, any> = {
  2025: {
    year: 2025,
    grados: { salud: 0, empresa: 0, psc: 0, vidaRiesgoInd: 0, ahorro: 0 },
    rapelAnual: { crecimientoMin: 0, devolucionesMax: 0, saludMin: 0, vidaMin: 0 },
    rapelCuatrimestral: {
      "1": { salud: 0, psc: 0, empresa: 0, particulares: 0, ahorro: 0, vida: 0 },
      "2": { salud: 0, psc: 0, empresa: 0, particulares: 0, ahorro: 0, vida: 0 },
      "3": { salud: 0, psc: 0, empresa: 0, particulares: 0, ahorro: 0, vida: 0 },
    },
  },

  2026: {
    year: 2026,
    grados: { salud: 20000, empresa: 40000, psc: 12000, vidaRiesgoInd: 10000, ahorro: 120000 },
    rapelAnual: {
      crecimientoMin: 0,
      devolucionesMax: 2,
      saludMin: 8000,
      vidaMin: 8000,
    },
    // Objetivos cuatrimestrales de GWPNP (campaña independiente de rapel anual)
    rapelCuatrimestral: {
      "1": { salud: 3501, psc: 2000, empresa: 16734, particulares: 56204, ahorro: 30000, vida: 2000 },
      "2": { salud: 0,    psc: 0,    empresa: 0,     particulares: 0,     ahorro: 0,     vida: 0    },
      "3": { salud: 0,    psc: 0,    empresa: 0,     particulares: 0,     ahorro: 0,     vida: 0    },
    },
  },

  2027: {
    year: 2027,
    grados: { salud: 0, empresa: 0, psc: 0, vidaRiesgoInd: 0, ahorro: 0 },
    rapelAnual: { crecimientoMin: 0, devolucionesMax: 0, saludMin: 0, vidaMin: 0 },
    rapelCuatrimestral: {
      "1": { salud: 0, psc: 0, empresa: 0, particulares: 0, ahorro: 0, vida: 0 },
      "2": { salud: 0, psc: 0, empresa: 0, particulares: 0, ahorro: 0, vida: 0 },
      "3": { salud: 0, psc: 0, empresa: 0, particulares: 0, ahorro: 0, vida: 0 },
    },
  },
}

export function getObjetivosByYear(year: number) {
  return (
    objetivosPorAno[year] ?? {
      year,
      grados: { salud: 0, empresa: 0, psc: 0, vidaRiesgoInd: 0, ahorro: 0 },
      rapelAnual: { crecimientoMin: 0, devolucionesMax: 0, saludMin: 0, vidaMin: 0 },
      rapelCuatrimestral: {
        "1": { salud: 0, psc: 0, empresa: 0, particulares: 0, ahorro: 0, vida: 0 },
        "2": { salud: 0, psc: 0, empresa: 0, particulares: 0, ahorro: 0, vida: 0 },
        "3": { salud: 0, psc: 0, empresa: 0, particulares: 0, ahorro: 0, vida: 0 },
      },
    }
  )
}
