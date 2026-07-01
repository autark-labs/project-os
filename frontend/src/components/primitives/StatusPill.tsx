import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'teal' | 'neutral';

const statusToneClass: Record<StatusTone, string> = {
  success: 'border-emerald-500/30 bg-emerald-600/10 text-emerald-700',
  warning: 'border-orange-500/35 bg-orange-600/10 text-orange-700',
  danger: 'border-red-400/35 bg-red-600/10 text-red-700',
  info: 'border-cyan-400/35 bg-cyan-400/10 text-cyan-700',
  teal: 'border-teal-500/30 bg-teal-600/10 text-teal-700',
  neutral: 'border-slate-500/30 bg-slate-700/10 text-slate-600',
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
