import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  delta?: string;
  status?: 'success' | 'warning' | 'danger';
  icon: LucideIcon;
}

export function KpiCard({ title, value, delta, status = 'success', icon: Icon }: KpiCardProps) {
  return (
    <div className="panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="panel-title">{title}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
          {delta ? (
            <p
              className={clsx('mt-2 text-sm font-medium', {
                'text-success': status === 'success',
                'text-warning': status === 'warning',
                'text-danger': status === 'danger'
              })}
            >
              {delta}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
