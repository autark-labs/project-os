import { AlertTriangle, Loader2, PlugZap, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Tone = 'danger' | 'info' | 'neutral' | 'warning';

const tones: Record<Tone, string> = {
  danger: 'border-po-danger-border bg-po-danger-soft text-po-danger',
  info: 'border-po-info-border bg-po-info-soft text-po-brand',
  neutral: 'border-po-border bg-po-surface text-po-text',
  warning: 'border-po-warning-border bg-po-warning-soft text-po-warning',
};

export function PageLoadingState({ label = 'Loading Project OS', sublabel = 'Checking the local backend and preparing this view.' }: { label?: string; sublabel?: string }) {
  return (
    <section className="grid min-h-[520px] w-full place-items-center rounded-lg border border-po-border bg-po-surface p-8 text-center text-po-text shadow-po-panel">
      <div className="grid justify-items-center gap-3">
        <span className="grid size-12 place-items-center rounded-lg border border-po-info-border bg-po-info-soft text-po-brand">
          <Loader2 className="size-5 animate-spin" />
        </span>
        <div>
          <p className="font-black text-po-text">{label}</p>
          <p className="mt-1 max-w-md text-sm leading-6 text-po-text-muted">{sublabel}</p>
        </div>
      </div>
    </section>
  );
}

export function PageEmptyState({ action, icon: Icon = Sparkles, message, title }: { action?: ReactNode; icon?: LucideIcon; message: string; title: string }) {
  return (
    <section className="grid min-h-[360px] place-items-center rounded-lg border border-po-border bg-po-surface-soft p-8 text-center text-po-text shadow-po-card">
      <div className="grid justify-items-center gap-3">
        <span className="grid size-12 place-items-center rounded-lg border border-po-border bg-po-surface text-po-text-secondary">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="font-black text-po-text">{title}</p>
          <p className="mt-1 max-w-md text-sm leading-6 text-po-text-muted">{message}</p>
        </div>
        {action}
      </div>
    </section>
  );
}

export function PageErrorState({ className, message, onRetry, title = 'Project OS could not load this view' }: { className?: string; message: string; onRetry?: () => void; title?: string }) {
  const offline = isBackendUnavailable(message);
  return (
    <div className={cn('rounded-lg border p-4 text-sm', tones[offline ? 'warning' : 'danger'], className)}>
      <div className="flex gap-3">
        {offline ? <PlugZap className="mt-0.5 size-5 shrink-0" /> : <AlertTriangle className="mt-0.5 size-5 shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-current">{offline ? 'Local backend looks unavailable' : title}</p>
          <p className="mt-1 leading-6 text-current/80">{message}</p>
          <p className="mt-2 text-xs leading-5 text-current/70">
            {offline ? 'Check that the Project OS backend is running, then refresh this page.' : 'Refresh the page. If this keeps happening, open Safe Diagnostics for the next step.'}
          </p>
          {onRetry && (
            <Button className="mt-3 border-current/25 bg-po-surface-elevated text-current hover:bg-po-surface-hover" onClick={onRetry} size="sm" type="button" variant="outline">
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function isBackendUnavailable(message: string) {
  return /network|failed to fetch|connection|timeout|refused|unavailable/i.test(message);
}
