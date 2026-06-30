import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type DisabledActionProps = {
  children: ReactNode;
  className?: string;
  disabled: boolean;
  reason: string;
};

export function DisabledAction({ children, className, disabled, reason }: DisabledActionProps) {
  if (!disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={reason}
            className={cn('inline-flex cursor-not-allowed [&_*]:pointer-events-none', className)}
            tabIndex={0}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-72 border border-sidebar-border bg-po-sidebar text-sidebar-foreground shadow-po-md">
          {reason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
