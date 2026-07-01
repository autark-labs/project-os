import type { ReactNode } from 'react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

export function ProjectEmptyState({
  className,
  description,
  icon,
  mediaClassName,
  title,
}: {
  className?: string;
  description: string;
  icon: ReactNode;
  mediaClassName?: string;
  title: string;
}) {
  return (
    <Empty className={cn('min-h-96 rounded-2xl border border-sky-400/30 bg-slate-900 text-slate-50', className)}>
      <EmptyHeader>
        <EmptyMedia className={cn('bg-cyan-300 text-slate-950', mediaClassName)} variant="icon">
          {icon}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription className="text-sky-100/70">{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

