export const objetivosPorAno: Record<number, any> = {
  2025: {
    year: 2025,
    grados: {
      salud: 0,
      empresa: 0,
      vida: 0,
      psc: 0,
      ahorro: 0,
    },
    rapelAnual: {
      crecimientoMin: 0,
      devolucionesMax: 0,
      saludMin: 0,
      vidaMin: 0,
    },
    rapelCuatrimestral: {
      "1": {
        salud: 0,
        psc: 0,
        empresa: 0,
        particulares: 0,
        ahorro: 0,
        vida: 0,
      },
      "2": {
        salud: 0,
        psc: 0,
        empresa: 0,
        particulares: 0,
        ahorro: 0,
        vida: 0,
      },
      "3": {
        salud: 0,
        psc: 0,
        empresa: 0,
        particulares: 0,
        ahorro: 0,
        vida: 0,
      },
    },
  },

  2026: {
    year: 2026,
    grados: {
      salud: 20000,
      empresa: 40000,
      vida: 12000,
      psc: 12000,
      ahorro: 100000,
    },
    rapelAnual: {
      crecimientoMin: 0,
      devolucionesMax: 2,
      saludMin: 8000,
      vidaMin: 8000,
    },
    rapelCuatrimestral: {
      "1": {
        salud: 3501,
        psc: 2000,
        empresa: 16734,
        particulares: 56204,
        ahorro: 30000,
        vida: 2000,
      },
      "2": {
        salud: 0,
        psc: 0,
        empresa: 0,
        particulares: 0,
        ahorro: 0,
        vida: 0,
      },
      "3": {
        salud: 0,
        psc: 0,
        empresa: 0,
        particulares: 0,
        ahorro: 0,
        vida: 0,
      },
    },
  },

  2027: {
    year: 2027,
    grados: {
      salud: 0,
      empresa: 0,
      vida: 0,
      psc: 0,
      ahorro: 0,
    },
    rapelAnual: {
      crecimientoMin: 0,
      devolucionesMax: 0,
      saludMin: 0,
      vidaMin: 0,
    },
    rapelCuatrimestral: {
      "1": {
        salud: 0,
        psc: 0,
        empresa: 0,
        particulares: 0,
        ahorro: 0,
        vida: 0,
      },
      "2": {
        salud: 0,
        psc: 0,
        empresa: 0,
        particulares: 0,
        ahorro: 0,
        vida: 0,
      },
      "3": {
        salud: 0,
        psc: 0,
        empresa: 0,
        particulares: 0,
        ahorro: 0,
        vida: 0,
      },
    },
  },
}

export function getObjetivosByYear(year: number) {
  return (
    objetivosPorAno[year] ?? {
      year,
      grados: {
        salud: 0,
        empresa: 0,
        vida: 0,
        psc: 0,
        ahorro: 0,
      },
      rapelAnual: {
        crecimientoMin: 0,
        devolucionesMax: 0,
        saludMin: 0,
        vidaMin: 0,
      },
      rapelCuatrimestral: {
        "1": {
          salud: 0,
          psc: 0,
          empresa: 0,
          particulares: 0,
          ahorro: 0,
          vida: 0,
        },
        "2": {
          salud: 0,
          psc: 0,
          empresa: 0,
          particulares: 0,
          ahorro: 0,
          vida: 0,
        },
        "3": {
          salud: 0,
          psc: 0,
          empresa: 0,
          particulares: 0,
          ahorro: 0,
          vida: 0,
        },
      },
    }
  )
}