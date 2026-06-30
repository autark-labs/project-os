import { Check, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MarketplaceApp } from '@/types/marketplace';

export function AppImage({ app, size = 'default' }: { app: MarketplaceApp; size?: 'default' | 'large' }) {
  return (
    <span className={cn('grid shrink-0 place-items-center overflow-hidden rounded-lg border border-po-border bg-po-surface-inset shadow-po-card', size === 'large' ? 'size-22' : 'size-14')}>
      {app.image ? (
        <img alt="" className="h-full w-full object-cover" src={app.image} />
      ) : (
        <span className="text-lg font-bold text-po-brand">{app.name.slice(0, 1)}</span>
      )}
    </span>
  );
}

export function CatalogConfidenceBadge({ app }: { app: MarketplaceApp }) {
  const verified = catalogVerified(app);
  return (
    <Badge className={cn('gap-1', verified ? 'border-po-success-border bg-po-success-soft text-po-success' : 'border-po-warning-border bg-po-warning-soft text-po-warning')} variant="outline">
      {verified ? <ShieldCheck className="size-3" /> : <TriangleAlert className="size-3" />}
      {verified ? 'Verified' : 'Validation needed'}
    </Badge>
  );
}

export function catalogVerified(app: MarketplaceApp) {
  return app.supportLevel === 'Ready'
    && app.smokeTests.length > 0
    && app.smokeTests.every((test) => ['Passed', 'Not applicable'].includes(test.status));
}

export function SupportBadge({ level }: { level: string }) {
  const tone = supportTone(level);
  return (
    <Badge className={cn('gap-1 border px-2.5 py-1', tone)} variant="outline">
      {level}
    </Badge>
  );
}

function supportTone(level: string) {
  switch (level) {
    case 'Ready':
      return 'border-po-success-border bg-po-success-soft text-po-success';
    case 'Advanced':
      return 'border-po-warning-border bg-po-warning-soft text-po-warning';
    case 'Needs testing':
      return 'border-po-info-border bg-po-info-soft text-po-brand';
    case 'Experimental':
      return 'border-po-danger-border bg-po-danger-soft text-po-danger';
    default:
      return 'border-po-border bg-po-surface-soft text-po-text-secondary';
  }
}

export function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-po-text-muted">{label}</span>
      <span className="inline-flex items-center gap-1 text-po-success">
        <Check className="size-3" />
        {value}
      </span>
    </div>
  );
}

export function FriendlyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-po-border bg-po-surface-soft p-4">
      <span className="text-xs text-po-text-muted">{label}</span>
      <p className="mt-1 font-bold text-po-text">{value}</p>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs text-po-text-muted">{label}</span>
      <strong className="text-sm text-po-text">{value}</strong>
    </div>
  );
}

export function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="rounded-lg border-po-border bg-po-surface-soft py-0 text-po-text">
      <CardContent className="p-4">
        <h4 className="font-bold text-po-text">{title}</h4>
        <ul className="mt-3 grid gap-2 pl-5 text-sm text-po-text-muted">
          {items.map((item) => <li className="list-disc" key={item}>{item}</li>)}
        </ul>
      </CardContent>
    </Card>
  );
}

export function Config({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-bold text-po-text-secondary">{label}</dt>
      <dd className="m-0 text-po-text-muted">{value}</dd>
    </>
  );
}
