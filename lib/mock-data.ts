import { AnnualGoalConfig, MonthlyMetrics } from '@/lib/types';

export const mockMetrics: MonthlyMetrics[] = [
  {
    year: 2026, month: 1, mediatorCode: '742776', renovacionPct: 93.8, tasaNpPct: 8.5, polizasNp: 42, polizas: 1885,
    netInflow: 17350, gwp: 214500, crecimientoPct: 4.2, gwpnp: 11200, cor: 91.3,
    gwpnpSalud: 2400, gwpnpParticulares: 3600, gwpnpAuto: 1100, gwpnpHogar: 950, gwpnpDecesos: 500, gwpnpComunidades: 350,
    gwpnpEmpresa: 2400, gwpnpFlota: 300, gwpnpComercio: 800, gwpnpIndustria: 600, gwpnpAccidentes: 250, gwpnpOficina: 150,
    gwpnpRc: 200, gwpnpTransporte: 100, gwpnpPsc: 900, gwpnpSaludColectivo: 450, gwpnpVidaColectivo: 450,
    gwpnpVida: 4200, gwpnpAhorro: 700, devolucionRecibosPct: 1.2
  },
  {
    year: 2026, month: 2, mediatorCode: '742776', renovacionPct: 94.3, tasaNpPct: 9.1, polizasNp: 49, polizas: 1898,
    netInflow: 18120, gwp: 219900, crecimientoPct: 4.8, gwpnp: 12600, cor: 90.1,
    gwpnpSalud: 2600, gwpnpParticulares: 3900, gwpnpAuto: 1200, gwpnpHogar: 1050, gwpnpDecesos: 550, gwpnpComunidades: 420,
    gwpnpEmpresa: 2600, gwpnpFlota: 340, gwpnpComercio: 900, gwpnpIndustria: 650, gwpnpAccidentes: 300, gwpnpOficina: 180,
    gwpnpRc: 130, gwpnpTransporte: 100, gwpnpPsc: 1000, gwpnpSaludColectivo: 550, gwpnpVidaColectivo: 450,
    gwpnpVida: 4300, gwpnpAhorro: 800, devolucionRecibosPct: 1.4
  },
  {
    year: 2026, month: 3, mediatorCode: '742776', renovacionPct: 92.9, tasaNpPct: 8.2, polizasNp: 37, polizas: 1902,
    netInflow: 16200, gwp: 221100, crecimientoPct: 3.9, gwpnp: 10300, cor: 92.5,
    gwpnpSalud: 1900, gwpnpParticulares: 3200, gwpnpAuto: 950, gwpnpHogar: 870, gwpnpDecesos: 510, gwpnpComunidades: 360,
    gwpnpEmpresa: 2100, gwpnpFlota: 280, gwpnpComercio: 700, gwpnpIndustria: 550, gwpnpAccidentes: 250, gwpnpOficina: 120,
    gwpnpRc: 100, gwpnpTransporte: 100, gwpnpPsc: 800, gwpnpSaludColectivo: 500, gwpnpVidaColectivo: 300,
    gwpnpVida: 3100, gwpnpAhorro: 1200, devolucionRecibosPct: 1.7
  },
  {
    year: 2026, month: 1, mediatorCode: '755224', renovacionPct: 91.5, tasaNpPct: 6.2, polizasNp: 14, polizas: 612,
    netInflow: 7400, gwp: 64100, crecimientoPct: 1.4, gwpnp: 3700, cor: 95.2,
    gwpnpSalud: 800, gwpnpParticulares: 1600, gwpnpAuto: 600, gwpnpHogar: 400, gwpnpDecesos: 250, gwpnpComunidades: 90,
    gwpnpEmpresa: 700, gwpnpFlota: 100, gwpnpComercio: 180, gwpnpIndustria: 140, gwpnpAccidentes: 100, gwpnpOficina: 80,
    gwpnpRc: 50, gwpnpTransporte: 50, gwpnpPsc: 300, gwpnpSaludColectivo: 150, gwpnpVidaColectivo: 150,
    gwpnpVida: 1400, gwpnpAhorro: 200, devolucionRecibosPct: 1.9
  },
  {
    year: 2026, month: 2, mediatorCode: '742826', renovacionPct: 95.2, tasaNpPct: 5.9, polizasNp: 10, polizas: 480,
    netInflow: 5100, gwp: 58900, crecimientoPct: 2.5, gwpnp: 2800, cor: 88.7,
    gwpnpSalud: 900, gwpnpParticulares: 1000, gwpnpAuto: 420, gwpnpHogar: 260, gwpnpDecesos: 170, gwpnpComunidades: 80,
    gwpnpEmpresa: 550, gwpnpFlota: 70, gwpnpComercio: 180, gwpnpIndustria: 140, gwpnpAccidentes: 60, gwpnpOficina: 40,
    gwpnpRc: 40, gwpnpTransporte: 20, gwpnpPsc: 150, gwpnpSaludColectivo: 80, gwpnpVidaColectivo: 70,
    gwpnpVida: 900, gwpnpAhorro: 150, devolucionRecibosPct: 0.8
  },
  {
    year: 2025, month: 12, mediatorCode: '742776', renovacionPct: 92.4, tasaNpPct: 7.8, polizasNp: 32, polizas: 1840,
    netInflow: 15100, gwp: 205800, crecimientoPct: 2.9, gwpnp: 9300, cor: 93.4,
    gwpnpSalud: 1600, gwpnpParticulares: 2700, gwpnpAuto: 850, gwpnpHogar: 790, gwpnpDecesos: 430, gwpnpComunidades: 230,
    gwpnpEmpresa: 1800, gwpnpFlota: 230, gwpnpComercio: 610, gwpnpIndustria: 520, gwpnpAccidentes: 190, gwpnpOficina: 110,
    gwpnpRc: 90, gwpnpTransporte: 50, gwpnpPsc: 500, gwpnpSaludColectivo: 220, gwpnpVidaColectivo: 280,
    gwpnpVida: 2600, gwpnpAhorro: 700, devolucionRecibosPct: 1.5
  }
];

export const mockGoals: AnnualGoalConfig = {
  year: 2026,
  rapelAnual: {
    vidaMin: 8000,
    saludMin: 8000,
    crecimientoMinPct: 0,
    devolucionRecibosMaxPct: 2
  },
  rapelCuatrimestral: {
    q1: { vidaMin: 3000, saludMin: 3000 },
    q2: { vidaMin: 2500, saludMin: 2500 },
    q3: { vidaMin: 2500, saludMin: 2500 }
  },
  grados: [
    { name: 'Grado Vida', target: 8000, metric: 'gwpnpVida' },
    { name: 'Grado Salud', target: 8000, metric: 'gwpnpSalud' },
    { name: 'Grado Empresa', target: 6000, metric: 'gwpnpEmpresa' },
    { name: 'Grado PSC', target: 3000, metric: 'gwpnpPsc' }
  ]
};
