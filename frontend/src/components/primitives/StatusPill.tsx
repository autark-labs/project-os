import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'teal' | 'neutral';

const statusToneClass: Record<StatusTone, string> = {
  success: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200',
  warning: 'border-orange-400/45 bg-orange-500/10 text-orange-200',
  danger: 'border-red-400/40 bg-red-500/10 text-red-200',
  info: 'border-cyan-300/35 bg-cyan-400/10 text-cyan-100',
  teal: 'border-teal-300/30 bg-teal-400/10 text-teal-100',
  neutral: 'border-sky-400/25 bg-slate-800 text-sky-100/80',
};

export function StatusPill({
  children,
  className,
  tone = 'neutral',
}: {
  children: ReactNode;
  className?: string;
  tone?: StatusTone;
}) {
  return (
    <Badge className={cn('min-h-7 rounded-full border px-2.5 py-1 text-xs font-semibold', statusToneClass[tone], className)} variant="outline">
      {children}
    </Badge>
  );
}
