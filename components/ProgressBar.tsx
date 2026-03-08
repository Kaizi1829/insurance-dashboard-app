import clsx from 'clsx';

export function ProgressBar({ current, target }: { current: number; target: number }) {
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={clsx('h-full rounded-full transition-all', {
            'bg-green-600': percent >= 100,
            'bg-amber-500': percent >= 80 && percent < 100,
            'bg-red-600': percent < 80
          })}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{percent.toFixed(0)}% del objetivo</p>
    </div>
  );
}
