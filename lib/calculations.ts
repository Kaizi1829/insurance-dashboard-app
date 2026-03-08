import { AnnualGoalConfig, DashboardAggregate, MonthlyMetrics, ObjectiveResult, Status } from '@/lib/types';

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function filterMetrics(metrics: MonthlyMetrics[], year: number, mediatorCode: DashboardAggregate['mediatorCode']) {
  return metrics.filter((item) => item.year === year && (mediatorCode === 'ALL' || item.mediatorCode === mediatorCode));
}

export function aggregateDashboard(metrics: MonthlyMetrics[], year: number, mediatorCode: DashboardAggregate['mediatorCode'] = 'ALL'): DashboardAggregate {
  const selected = filterMetrics(metrics, year, mediatorCode);
  const total = <K extends keyof MonthlyMetrics>(key: K) => selected.reduce((sum, item) => sum + Number(item[key] ?? 0), 0);
  const average = <K extends keyof MonthlyMetrics>(key: K) => (selected.length ? total(key) / selected.length : 0);

  const monthlyMap = new Map<number, MonthlyMetrics[]>();
  selected.forEach((item) => {
    const bucket = monthlyMap.get(item.month) ?? [];
    bucket.push(item);
    monthlyMap.set(item.month, bucket);
  });

  const monthlySeries = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthItems = monthlyMap.get(month) ?? [];
    const monthTotal = <K extends keyof MonthlyMetrics>(key: K) => monthItems.reduce((sum, item) => sum + Number(item[key] ?? 0), 0);
    const monthAvg = <K extends keyof MonthlyMetrics>(key: K) => (monthItems.length ? monthTotal(key) / monthItems.length : 0);

    return {
      month,
      label: monthNames[index],
      gwp: monthTotal('gwp'),
      gwpnp: monthTotal('gwpnp'),
      renovacionPct: Number(monthAvg('renovacionPct').toFixed(2)),
      cor: Number(monthAvg('cor').toFixed(2)),
      vidaSalud: monthTotal('gwpnpVida') + monthTotal('gwpnpSalud')
    };
  });

  return {
    year,
    mediatorCode,
    totals: {
      gwp: total('gwp'),
      gwpnp: total('gwpnp'),
      polizas: total('polizas'),
      polizasNp: total('polizasNp'),
      netInflow: total('netInflow'),
      gwpnpVida: total('gwpnpVida'),
      gwpnpSalud: total('gwpnpSalud')
    },
    averages: {
      renovacionPct: Number(average('renovacionPct').toFixed(2)),
      tasaNpPct: Number(average('tasaNpPct').toFixed(2)),
      crecimientoPct: Number(average('crecimientoPct').toFixed(2)),
      cor: Number(average('cor').toFixed(2))
    },
    monthlySeries
  };
}

export function getStatus(current: number, target: number, inverse = false): Status {
  if (!inverse) {
    if (current >= target) return 'success';
    if (current >= target * 0.8) return 'warning';
    return 'danger';
  }

  if (current <= target) return 'success';
  if (current <= target * 1.2) return 'warning';
  return 'danger';
}

export function evaluateAnnualGoals(metrics: MonthlyMetrics[], config: AnnualGoalConfig, year: number, mediatorCode: DashboardAggregate['mediatorCode'] = 'ALL') {
  const dashboard = aggregateDashboard(metrics, year, mediatorCode);
  const selected = filterMetrics(metrics, year, mediatorCode);
  const avgDevolucion = selected.length
    ? selected.reduce((sum, item) => sum + Number(item.devolucionRecibosPct ?? 0), 0) / selected.length
    : 0;

  const results: ObjectiveResult[] = [
    {
      label: 'Rapel anual · Vida',
      current: dashboard.totals.gwpnpVida,
      target: config.rapelAnual.vidaMin,
      status: getStatus(dashboard.totals.gwpnpVida, config.rapelAnual.vidaMin),
      unit: '€'
    },
    {
      label: 'Rapel anual · Salud',
      current: dashboard.totals.gwpnpSalud,
      target: config.rapelAnual.saludMin,
      status: getStatus(dashboard.totals.gwpnpSalud, config.rapelAnual.saludMin),
      unit: '€'
    },
    {
      label: 'Rapel anual · Crecimiento',
      current: dashboard.averages.crecimientoPct,
      target: config.rapelAnual.crecimientoMinPct,
      status: getStatus(dashboard.averages.crecimientoPct, config.rapelAnual.crecimientoMinPct),
      unit: '%'
    },
    {
      label: 'Rapel anual · Devolución recibos',
      current: Number(avgDevolucion.toFixed(2)),
      target: config.rapelAnual.devolucionRecibosMaxPct,
      status: getStatus(avgDevolucion, config.rapelAnual.devolucionRecibosMaxPct, true),
      unit: '%'
    }
  ];

  const rapelAnualConseguido = results.every((item) => item.status === 'success');
  return { results, rapelAnualConseguido };
}

export function evaluateQuadrimester(metrics: MonthlyMetrics[], config: AnnualGoalConfig, year: number, mediatorCode: DashboardAggregate['mediatorCode'] = 'ALL') {
  const selected = filterMetrics(metrics, year, mediatorCode);
  const ranges = [
    { key: 'q1', label: 'Ene - Abr', months: [1, 2, 3, 4] as const },
    { key: 'q2', label: 'May - Ago', months: [5, 6, 7, 8] as const },
    { key: 'q3', label: 'Sep - Dic', months: [9, 10, 11, 12] as const }
  ] as const;

  return ranges.map((range) => {
    const set = selected.filter((item) => range.months.includes(item.month as never));
    const vida = set.reduce((sum, item) => sum + item.gwpnpVida, 0);
    const salud = set.reduce((sum, item) => sum + item.gwpnpSalud, 0);
    const target = config.rapelCuatrimestral[range.key];

    return {
      label: range.label,
      vida,
      salud,
      vidaStatus: getStatus(vida, target.vidaMin),
      saludStatus: getStatus(salud, target.saludMin),
      achieved: vida >= target.vidaMin && salud >= target.saludMin,
      target
    };
  });
}

export function evaluateGrades(metrics: MonthlyMetrics[], config: AnnualGoalConfig, year: number, mediatorCode: DashboardAggregate['mediatorCode'] = 'ALL') {
  const dashboard = aggregateDashboard(metrics, year, mediatorCode);
  const selected = filterMetrics(metrics, year, mediatorCode);
  const retentionAverage = selected.length
    ? selected.reduce((sum, item) => sum + item.renovacionPct, 0) / selected.length
    : 0;

  return config.grados.map((grade) => {
    let current = 0;
    switch (grade.metric) {
      case 'gwpnpVida':
        current = dashboard.totals.gwpnpVida;
        break;
      case 'gwpnpSalud':
        current = dashboard.totals.gwpnpSalud;
        break;
      case 'gwpnpEmpresa':
        current = selected.reduce((sum, item) => sum + item.gwpnpEmpresa, 0);
        break;
      case 'gwpnpPsc':
        current = selected.reduce((sum, item) => sum + item.gwpnpPsc, 0);
        break;
      case 'gwpnpVidaPlusSalud':
        current = dashboard.totals.gwpnpVida + dashboard.totals.gwpnpSalud;
        break;
      case 'retentionAverage':
        current = retentionAverage;
        break;
      default:
        current = selected.reduce((sum, item) => sum + Number(item[grade.metric as keyof MonthlyMetrics] ?? 0), 0);
    }

    return {
      name: grade.name,
      current,
      target: grade.target,
      status: getStatus(current, grade.target)
    };
  });
}

export function detectTrendRisk(series: DashboardAggregate['monthlySeries']) {
  const nonZero = series.filter((item) => item.gwpnp > 0);
  if (nonZero.length < 3) return null;
  const lastThree = nonZero.slice(-3);
  const isFalling = lastThree[0].gwpnp > lastThree[1].gwpnp && lastThree[1].gwpnp > lastThree[2].gwpnp;
  if (!isFalling) return null;
  return 'La nueva producción cae durante 3 meses seguidos. Conviene revisar actividad comercial y campañas.';
}

export function formatNumber(value: number, unit?: string) {
  if (unit === '€') {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  }
  if (unit === '%') {
    return `${value.toFixed(2)}%`;
  }
  return new Intl.NumberFormat('es-ES').format(value);
}
