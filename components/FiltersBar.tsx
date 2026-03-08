'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { MediatorCode } from '@/lib/types';

const mediators: Array<MediatorCode | 'ALL'> = ['ALL', '742776', '755224', '742826'];
const years = [2026, 2025, 2024];

export function FiltersBar() {
  const router = useRouter();
  const params = useSearchParams();
  const year = params.get('year') ?? '2026';
  const mediator = (params.get('mediator') ?? 'ALL') as MediatorCode | 'ALL';

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.push(`/?${next.toString()}`);
  };

  return (
    <div className="panel flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="panel-title">Filtros de análisis</p>
        <h2 className="mt-1 text-lg font-semibold">Selecciona año y mediador</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-600">
          Año
          <select
            value={year}
            onChange={(e) => update('year', e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
          >
            {years.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-600">
          Mediador
          <select
            value={mediator}
            onChange={(e) => update('mediator', e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
          >
            {mediators.map((item) => (
              <option key={item} value={item}>{item === 'ALL' ? 'GLOBAL' : item}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
