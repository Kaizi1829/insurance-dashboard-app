export type MediatorCode = '742776' | '755224' | '742826';

export type Status = 'success' | 'warning' | 'danger';

export interface MonthlyMetrics {
  id?: string;
  year: number;
  month: number;
  mediatorCode: MediatorCode;
  renovacionPct: number;
  tasaNpPct: number;
  polizasNp: number;
  polizas: number;
  netInflow: number;
  gwp: number;
  crecimientoPct: number;
  gwpnp: number;
  cor: number;
  gwpnpSalud: number;
  gwpnpParticulares: number;
  gwpnpAuto: number;
  gwpnpHogar: number;
  gwpnpDecesos: number;
  gwpnpComunidades: number;
  gwpnpEmpresa: number;
  gwpnpFlota: number;
  gwpnpComercio: number;
  gwpnpIndustria: number;
  gwpnpAccidentes: number;
  gwpnpOficina: number;
  gwpnpRc: number;
  gwpnpTransporte: number;
  gwpnpPsc: number;
  gwpnpSaludColectivo: number;
  gwpnpVidaColectivo: number;
  gwpnpVida: number;
  gwpnpAhorro: number;
  devolucionRecibosPct?: number;
}

export interface AnnualGoalConfig {
  id?: string;
  year: number;
  rapelAnual: {
    vidaMin: number;
    saludMin: number;
    crecimientoMinPct: number;
    devolucionRecibosMaxPct: number;
  };
  rapelCuatrimestral: {
    q1: { vidaMin: number; saludMin: number };
    q2: { vidaMin: number; saludMin: number };
    q3: { vidaMin: number; saludMin: number };
  };
  grados: Array<{
    name: string;
    target: number;
    metric: keyof MonthlyMetrics | 'gwpnpVidaPlusSalud' | 'retentionAverage';
  }>;
}

export interface ObjectiveResult {
  label: string;
  current: number;
  target: number;
  status: Status;
  unit?: string;
}

export interface DashboardAggregate {
  year: number;
  mediatorCode: MediatorCode | 'ALL';
  totals: {
    gwp: number;
    gwpnp: number;
    polizas: number;
    polizasNp: number;
    netInflow: number;
    gwpnpVida: number;
    gwpnpSalud: number;
  };
  averages: {
    renovacionPct: number;
    tasaNpPct: number;
    crecimientoPct: number;
    cor: number;
  };
  monthlySeries: Array<{
    month: number;
    label: string;
    gwp: number;
    gwpnp: number;
    renovacionPct: number;
    cor: number;
    vidaSalud: number;
  }>;
}
