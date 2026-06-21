import { Link } from 'react-router-dom';
import { ExternalLink, Link2, ShieldAlert, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AppOwnershipView } from '@/types/appOwnership';

type FoundServicesPanelProps = {
  items: AppOwnershipView[];
  onIgnoreFoundResource: (resourceId: string) => void;
  onRemoveLinkedService: (id: string) => void;
};

export function FoundServicesPanel({ items, onIgnoreFoundResource, onRemoveLinkedService }: FoundServicesPanelProps) {
  if (!items.length) {
    return null;
  }
  return (
    <section className="grid gap-3">
      <div>
        <h4 className="text-sm font-black uppercase tracking-normal text-amber-300">Existing services</h4>
        <p className="mt-1 text-sm text-slate-500">Project OS knows about these services, but they are not installed by this Project OS instance.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => <FoundServiceCard item={item} key={`${item.state}:${item.catalogAppId}`} onIgnoreFoundResource={onIgnoreFoundResource} onRemoveLinkedService={onRemoveLinkedService} />)}
      </div>
    </section>
  );
}

function FoundServiceCard({
  item,
  onIgnoreFoundResource,
  onRemoveLinkedService,
}: {
  item: AppOwnershipView;
  onIgnoreFoundResource: (resourceId: string) => void;
  onRemoveLinkedService: (id: string) => void;
}) {
  const openHref = item.linkedService?.url || item.foundResource?.accessUrls?.[0] || null;
  const reviewHref = item.reviewExistingHref || '/apps/found';
  return (
    <article className="grid min-h-[230px] gap-4 rounded-xl border border-amber-300/20 bg-amber-500/8 p-4 shadow-po-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-white">{item.name}</h3>
          <p className="mt-1 truncate text-sm text-slate-400">{item.category || 'Existing service'}</p>
        </div>
        <Badge className={stateBadgeClass(item.statusTone)} variant="outline">{item.stateLabel}</Badge>
      </div>
      <p className="line-clamp-3 text-sm leading-5 text-amber-100/85">{item.stateDescription}</p>
      {item.state === 'found_on_server' && (
        <p className="rounded-lg border border-slate-800 bg-slate-950/45 p-3 text-xs leading-5 text-slate-400">
          Project OS can link this service or install a managed copy, but guided adoption for unmanaged Docker containers is not available yet.
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-2">
        {openHref && (
          <Button asChild className="bg-sky-500 text-slate-950 hover:bg-sky-400" size="sm">
            <a href={openHref} rel="noreferrer" target="_blank">
              <ExternalLink className="size-4" />
              Open
            </a>
          </Button>
        )}
        <Button asChild className="border-slate-700/60 bg-slate-950/50 text-slate-200 hover:bg-slate-800" size="sm" variant="outline">
          <Link to={reviewHref}>
            <ShieldAlert className="size-4" />
            Review
          </Link>
        </Button>
        <Button asChild className="border-slate-700/60 bg-slate-950/50 text-slate-200 hover:bg-slate-800" size="sm" variant="outline">
          <Link to={`/discover?app=${encodeURIComponent(item.catalogAppId)}`}>
            <Link2 className="size-4" />
            Install copy
          </Link>
        </Button>
        {item.linkedService && (
          <Button className="border-slate-700/60 bg-slate-950/50 text-slate-200 hover:bg-slate-800" onClick={() => onRemoveLinkedService(item.linkedService?.id || '')} size="sm" type="button" variant="outline">
            <Trash2 className="size-4" />
            Remove link
          </Button>
        )}
        {item.foundResource && (
          <Button className="border-slate-700/60 bg-slate-950/50 text-slate-200 hover:bg-slate-800" onClick={() => onIgnoreFoundResource(item.foundResource?.id || '')} size="sm" type="button" variant="outline">
            Ignore
          </Button>
        )}
      </div>
    </article>
  );
}

function stateBadgeClass(tone: string) {
  return cn(
    tone === 'success' && 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100',
    tone === 'info' && 'border-sky-300/25 bg-sky-500/10 text-sky-100',
    tone === 'warning' && 'border-amber-300/25 bg-amber-500/10 text-amber-100',
    tone === 'danger' && 'border-red-300/25 bg-red-500/10 text-red-100',
    tone === 'neutral' && 'border-slate-600 bg-slate-800/60 text-slate-300',
  );
}
