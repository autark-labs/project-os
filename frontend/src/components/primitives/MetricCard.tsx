import { cn } from '@/lib/utils';

type MetricCardTone = 'default' | 'attention';

const metricToneClass: Record<MetricCardTone, string> = {
  default: 'border-sky-400/25 bg-slate-800 text-sky-50',
  attention: 'border-orange-400 bg-orange-200 text-orange-950 shadow-lg shadow-orange-500/20',
};

export function MetricCard({
  className,
  label,
  tone = 'default',
  value,
}: {
  className?: string;
  label: string;
  tone?: MetricCardTone;
  value: number | string;
}) {
  const attention = tone === 'attention';

  return (
    <div className={cn('min-w-28 rounded-xl border px-4 py-3', metricToneClass[tone], className)}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className={attention ? 'text-sm text-orange-800' : 'text-sm text-sky-100/70'}>{label}</div>
    </div>
  );
}

