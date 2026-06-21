import { ExternalLink, Pin, SearchCheck, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ObservedServiceView } from '@/types/observedService';

type ObservedServicesPanelProps = {
  items: ObservedServiceView[];
  onReviewService: (id: string) => void;
};

export function ObservedServicesPanel({ items, onReviewService }: ObservedServicesPanelProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="grid gap-3">
      <div>
        <h4 className="text-sm font-black uppercase tracking-normal text-amber-300">Observed on this system</h4>
        <p className="mt-1 text-sm text-slate-500">Every known service stays visible here, including services that are not pinned to My Apps.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => <ObservedServiceCard item={item} key={item.id} onReviewService={onReviewService} />)}
      </div>
    </section>
  );
}

function ObservedServiceCard({ item, onReviewService }: { item: ObservedServiceView; onReviewService: (id: string) => void }) {
  return (
    <article className={cn('grid min-h-[220px] gap-4 rounded-xl border p-4 shadow-po-card', serviceCardClass(item))}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-white">{item.displayName}</h3>
          <p className="mt-1 truncate text-sm text-slate-400">{item.category || item.source || 'Observed service'}</p>
        </div>
        <Badge className={stateBadgeClass(item)} variant="outline">{item.userStatusLabel || stateLabel(item)}</Badge>
      </div>
      <p className="line-clamp-3 text-sm leading-5 text-slate-300">{item.userStatusDescription || 'Project OS sees this service but does not manage it.'}</p>
      <div className="grid gap-2 rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <SearchCheck className="size-3.5 text-slate-500" />
          {item.runtimeState || 'Runtime unknown'} · {item.accessScope || 'Access unknown'}
        </span>
        {item.pinned && (
          <span className="flex items-center gap-2 text-sky-100">
            <Pin className="size-3.5" />
            Pinned to My Apps
          </span>
        )}
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        {item.url && (
          <Button asChild className="bg-sky-500 text-slate-950 hover:bg-sky-400" size="sm">
            <a href={item.url} rel="noreferrer" target="_blank">
              <ExternalLink className="size-4" />
              Open
            </a>
          </Button>
        )}
        <Button className="border-slate-700/60 bg-slate-950/50 text-slate-200 hover:bg-slate-800" onClick={() => onReviewService(item.id)} size="sm" type="button" variant="outline">
          <ShieldAlert className="size-4" />
          Review
        </Button>
      </div>
    </article>
  );
}

function stateLabel(item: ObservedServiceView) {
  if (item.pinned) return 'Pinned';
  if (item.userStatus === 'recoverable') return 'Recoverable';
  if (item.userStatus === 'managed_elsewhere') return 'Owned elsewhere';
  if (item.userStatus === 'blocked') return 'Conflict';
  return 'Found';
}

function stateBadgeClass(item: ObservedServiceView) {
  return cn(
    item.userStatus === 'pinned_external' && 'border-sky-300/25 bg-sky-500/10 text-sky-100',
    item.userStatus === 'recoverable' && 'border-amber-300/25 bg-amber-500/10 text-amber-100',
    (item.userStatus === 'managed_elsewhere' || item.userStatus === 'blocked') && 'border-red-300/25 bg-red-500/10 text-red-100',
    !['pinned_external', 'recoverable', 'managed_elsewhere', 'blocked'].includes(item.userStatus) && 'border-slate-600 bg-slate-800/60 text-slate-300',
  );
}

function serviceCardClass(item: ObservedServiceView) {
  if (item.userStatus === 'pinned_external') return 'border-sky-300/20 bg-sky-500/8';
  if (item.userStatus === 'recoverable') return 'border-amber-300/20 bg-amber-500/8';
  if (item.userStatus === 'managed_elsewhere' || item.userStatus === 'blocked') return 'border-red-300/20 bg-red-500/8';
  return 'border-white/10 bg-slate-950/48';
}
