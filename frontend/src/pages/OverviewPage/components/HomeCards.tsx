import type { ComponentType, ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Info, MoreVertical, Sparkles, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DisabledAction } from '@/components/project-os/DisabledAction';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Surface } from '@/components/primitives/Surface';
import { cn } from '@/lib/utils';
import type { ProjectOsAction, ProjectOsIssue } from '@/types/app';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'teal' | 'neutral';

const toneClasses: Record<Tone, {
  badge: string;
  glow: string;
  icon: string;
  pulse: string;
  text: string;
}> = {
  success: {
    badge: 'border-emerald-500/30 bg-emerald-600/10 text-emerald-700',
    glow: 'shadow-emerald-700/20',
    icon: 'bg-emerald-600/10 text-emerald-700',
    pulse: 'bg-emerald-600 shadow-[0_0_0_5px_rgb(5_150_105_/_0.14)]',
    text: 'text-emerald-700',
  },
  warning: {
    badge: 'border-orange-500/35 bg-orange-600/10 text-orange-700',
    glow: 'shadow-orange-700/20',
    icon: 'bg-orange-600/10 text-orange-700',
    pulse: 'bg-orange-700 shadow-[0_0_0_5px_rgb(194_65_12_/_0.14)]',
    text: 'text-orange-700',
  },
  danger: {
    badge: 'border-red-400/35 bg-red-600/10 text-red-700',
    glow: 'shadow-red-700/20',
    icon: 'bg-red-600/10 text-red-700',
    pulse: 'bg-red-600 shadow-[0_0_0_5px_rgb(220_38_38_/_0.14)]',
    text: 'text-red-700',
  },
  info: {
    badge: 'border-cyan-400/35 bg-cyan-400/10 text-cyan-700',
    glow: 'shadow-cyan-700/20',
    icon: 'bg-cyan-400/10 text-cyan-700',
    pulse: 'bg-cyan-400 shadow-[0_0_0_5px_rgb(34_211_238_/_0.15)]',
    text: 'text-cyan-700',
  },
  teal: {
    badge: 'border-teal-500/30 bg-teal-600/10 text-teal-700',
    glow: 'shadow-teal-700/20',
    icon: 'bg-teal-600/10 text-teal-700',
    pulse: 'bg-teal-700 shadow-[0_0_0_5px_rgb(15_118_110_/_0.14)]',
    text: 'text-teal-700',
  },
  neutral: {
    badge: 'border-cyan-800/35 bg-slate-900 text-slate-600',
    glow: 'shadow-cyan-950/15',
    icon: 'bg-slate-900 text-slate-600',
    pulse: 'bg-slate-500 shadow-[0_0_0_5px_rgb(86_113_132_/_0.12)]',
    text: 'text-slate-600',
  },
};

export function HomeSection({
  action,
  children,
  className,
  description,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  title?: ReactNode;
}) {
  return (
    <section className={cn('grid gap-4', className)}>
      {(title || description || action) && (
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            {title && <h2 className="m-0 text-2xl font-bold text-slate-950">{title}</h2>}
            {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function HomeSoftCard({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <Surface
      className={cn(
        'p-5',
        interactive && 'transition hover:-translate-y-0.5 hover:border-cyan-400/60 hover:bg-sky-50 hover:shadow-2xl hover:shadow-cyan-700/20',
        className,
      )}
      tone="control"
    >
      {children}
    </Surface>
  );
}

export function HomeActionCard({
  action,
  body,
  className,
  dismissible = false,
  severity = 'info',
  title,
}: {
  action?: ProjectOsAction | null;
  body: ReactNode;
  className?: string;
  dismissible?: boolean;
  severity?: string;
  title: ReactNode;
}) {
  const tone = issueTone(severity);
  const Icon = issueIcon(severity);

  return (
    <HomeSoftCard className={cn('relative overflow-hidden shadow-2xl', toneClasses[tone].glow, className)}>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="flex min-w-0 gap-3">
          <div className={cn('grid size-11 shrink-0 place-items-center rounded-xl', toneClasses[tone].icon)}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="m-0 text-base font-bold text-slate-950">{title}</p>
            <p className="m-0 mt-1 text-sm leading-6 text-slate-600">{body}</p>
            {dismissible && <p className="m-0 mt-1 text-xs text-slate-500">You can dismiss this after reviewing it.</p>}
          </div>
        </div>
        <HomeActionButton action={action} className="w-full sm:w-auto" />
      </div>
    </HomeSoftCard>
  );
}

export function HomeIssueBanner({
  className,
  issue,
}: {
  className?: string;
  issue: ProjectOsIssue;
}) {
  const tone = issueTone(issue.severity);
  const Icon = issueIcon(issue.severity);

  return (
    <div className={cn('flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-start sm:justify-between', toneClasses[tone].badge, className)}>
      <div className="flex min-w-0 gap-3">
        <div className={cn('grid size-9 shrink-0 place-items-center rounded-lg', toneClasses[tone].icon)}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="m-0 text-sm font-bold">{issue.title}</p>
          <p className="m-0 mt-1 text-sm leading-5 opacity-80">{issue.summary}</p>
        </div>
      </div>
      {issue.primaryAction && (
        <div className="shrink-0">
          <HomeActionButton action={issue.primaryAction} variant="secondary" />
        </div>
      )}
    </div>
  );
}

export function HomeMetricCard({
  action,
  className,
  detail,
  icon: Icon,
  progress,
  tone = 'info',
  value,
  label,
}: {
  action?: ReactNode;
  className?: string;
  detail?: ReactNode;
  icon: LucideIcon;
  label: ReactNode;
  progress?: number;
  tone?: Tone;
  value: ReactNode;
}) {
  const normalizedProgress = typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : null;

  return (
    <HomeSoftCard className={cn('grid gap-4', className)} interactive>
      <div className="flex items-start justify-between gap-3">
        <div className={cn('grid size-11 place-items-center rounded-xl', toneClasses[tone].icon)}>
          <Icon className="size-5" />
        </div>
        <HomeGlowBadge tone={tone}>{label}</HomeGlowBadge>
      </div>
      <div>
        <p className="m-0 text-2xl font-bold text-slate-950">{value}</p>
        {detail && <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>}
      </div>
      {normalizedProgress !== null && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-900">
          <div className={cn('h-full rounded-full', toneClasses[tone].pulse)} style={{ width: `${normalizedProgress}%` }} />
        </div>
      )}
      {action && <div className="pt-1 text-sm font-semibold text-cyan-600">{action}</div>}
    </HomeSoftCard>
  );
}

export function HomeQuickAccessTile({
  actionLabel = 'Open',
  description,
  href,
  icon,
  iconUrl,
  name,
  secondaryActionLabel,
  secondaryTo,
  status,
  statusTone = 'success',
  to,
}: {
  actionLabel?: string;
  description?: ReactNode;
  href?: string;
  icon?: ReactNode;
  iconUrl?: string | null;
  name: ReactNode;
  secondaryActionLabel?: string;
  secondaryTo?: string;
  status?: ReactNode;
  statusTone?: Tone;
  to?: string;
}) {
  const primaryButtonClass = 'h-9 rounded-lg border-cyan-400/35 bg-cyan-600 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-700/20 hover:bg-cyan-400';
  const secondaryButtonClass = 'h-9 rounded-lg border-cyan-800/20 bg-sky-50 px-4 text-sm font-semibold text-slate-600 hover:border-cyan-400/60 hover:bg-sky-100 hover:text-slate-950';
  const action = href ? (
    <Button asChild className={primaryButtonClass} size="sm">
      <a href={href} rel="noreferrer" target="_blank">{actionLabel}</a>
    </Button>
  ) : to ? (
    <Button asChild className={primaryButtonClass} size="sm">
      <Link to={to}>{actionLabel}</Link>
    </Button>
  ) : (
    <DisabledAction disabled reason="This action is not available yet.">
      <Button className={primaryButtonClass} disabled size="sm" type="button">
        {actionLabel}
      </Button>
    </DisabledAction>
  );
  const secondaryAction = secondaryActionLabel && secondaryTo ? (
    <Button asChild className={secondaryButtonClass} size="sm" variant="outline">
      <Link to={secondaryTo}>{secondaryActionLabel}</Link>
    </Button>
  ) : null;
  const detailRoute = secondaryTo ?? to ?? '/apps';

  return (
    <HomeSoftCard
      className={cn(
        'grid min-h-[214px] content-between overflow-hidden rounded-xl text-left shadow-lg shadow-cyan-950/15',
        'transition hover:-translate-y-0.5 hover:border-cyan-400/35 hover:bg-sky-50 hover:shadow-2xl hover:shadow-cyan-700/20',
      )}
    >
      <div className="grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid size-16 place-items-center overflow-hidden rounded-xl border border-cyan-800/20 bg-sky-50 text-cyan-700 shadow-md shadow-cyan-950/10">
            {iconUrl ? <img alt="" className="size-full object-contain p-2" src={iconUrl} /> : icon || <Sparkles className="size-8" />}
          </div>
          <div className="flex items-center gap-2">
            {status && <HomeGlowBadge className="rounded-full px-2.5 py-0.5 text-xs" tone={statusTone}>{status}</HomeGlowBadge>}
            <Button asChild aria-label="App details" className="size-8 rounded-lg border-cyan-800/20 bg-sky-50 text-slate-500 hover:bg-sky-100 hover:text-slate-950" size="icon" variant="outline">
              <Link to={detailRoute}>
                <MoreVertical className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div>
          <p className="m-0 truncate text-base font-bold text-slate-950">{name}</p>
          {description && <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{description}</p>}
        </div>
      </div>
      <div className={cn('grid gap-2 pt-4', secondaryAction && '2xl:grid-cols-2')}>
        {action}
        {secondaryAction}
      </div>
    </HomeSoftCard>
  );
}

export function HomeActivityTimeline({
  className,
  emptyText = 'No recent activity yet.',
  items,
}: {
  className?: string;
  emptyText?: ReactNode;
  items: Array<{
    id: string | number;
    title: ReactNode;
    detail?: ReactNode;
    time?: ReactNode;
    tone?: Tone;
    icon?: ComponentType<{ className?: string }>;
  }>;
}) {
  if (!items.length) {
    return <HomeEmptyLine title={emptyText} />;
  }

  return (
    <div className={cn('grid gap-0', className)}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const tone = item.tone || 'neutral';
        return (
          <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-3" key={item.id}>
            <div className="grid justify-items-center">
              <div className={cn('grid size-8 place-items-center rounded-full border', toneClasses[tone].badge)}>
                {Icon ? <Icon className="size-4" /> : <span className={cn('size-2 rounded-full', toneClasses[tone].pulse)} />}
              </div>
              {index < items.length - 1 && <div className="h-full min-h-5 w-px bg-cyan-800/20" />}
            </div>
            <div className="pb-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="m-0 font-semibold text-slate-950">{item.title}</p>
                {item.time && <span className="text-xs text-slate-500">{item.time}</span>}
              </div>
              {item.detail && <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HomeActionButton({
  action,
  className,
  fallbackRoute,
  variant = 'default',
}: {
  action?: ProjectOsAction | null;
  className?: string;
  fallbackRoute?: string;
  variant?: 'default' | 'outline' | 'secondary';
}) {
  if (!action && !fallbackRoute) {
    return null;
  }
  const label = typeof action?.label === 'string' ? action.label : 'Open';
  const route = typeof action?.route === 'string' ? action.route : fallbackRoute;
  const href = typeof action?.href === 'string' ? action.href : undefined;
  if (route) {
    return (
      <Button asChild className={className} size="sm" variant={variant}>
        <Link to={route}>{label}</Link>
      </Button>
    );
  }
  if (href) {
    return (
      <Button asChild className={className} size="sm" variant={variant}>
        <a href={href} rel="noreferrer" target={href.startsWith('http') ? '_blank' : undefined}>{label}</a>
      </Button>
    );
  }
  return (
    <DisabledAction disabled reason="This action is not available yet.">
      <Button className={className} disabled size="sm" type="button" variant={variant}>
        {label}
      </Button>
    </DisabledAction>
  );
}

function HomeGlowBadge({
  children,
  className,
  tone = 'info',
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <Badge className={cn('border px-2.5 py-1', toneClasses[tone].badge, className)} variant="outline">
      {children}
    </Badge>
  );
}

function HomeEmptyLine({ title }: { title: ReactNode }) {
  return (
    <div className="rounded-lg border border-cyan-800/20 bg-sky-50 px-3 py-2 text-sm text-slate-600">
      {title}
    </div>
  );
}

function issueTone(severity?: string): Tone {
  if (severity === 'success') return 'success';
  if (severity === 'critical') return 'danger';
  if (severity === 'warning') return 'warning';
  if (severity === 'info') return 'info';
  return 'neutral';
}

function issueIcon(severity?: string): LucideIcon {
  if (severity === 'success') return CheckCircle2;
  if (severity === 'critical') return XCircle;
  if (severity === 'warning') return AlertTriangle;
  return Info;
}
