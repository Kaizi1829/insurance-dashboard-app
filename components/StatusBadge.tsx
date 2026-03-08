import clsx from 'clsx';
import { Status } from '@/lib/types';

const labelMap: Record<Status, string> = {
  success: '✔ Cumplido',
  warning: '⚠ En riesgo',
  danger: '✖ No cumplido'
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={clsx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', {
        'bg-green-50 text-green-700': status === 'success',
        'bg-amber-50 text-amber-700': status === 'warning',
        'bg-red-50 text-red-700': status === 'danger'
      })}
    >
      <span
        className={clsx('status-dot', {
          'bg-green-600': status === 'success',
          'bg-amber-500': status === 'warning',
          'bg-red-600': status === 'danger'
        })}
      />
      {labelMap[status]}
    </span>
  );
}
