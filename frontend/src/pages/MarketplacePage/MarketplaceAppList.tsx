import { CheckCircle2, ChevronDown, Clock3, Info, Loader2, MoreHorizontal, SlidersHorizontal, Sparkles, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DisabledAction } from '@/components/project-os/DisabledAction';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { poButtonClass } from '@/lib/projectOsStyleKit';
import { cn } from '@/lib/utils';
import type { DiscoverAppView } from '@/types/discover';
import type { MarketplaceApp } from '@/types/marketplace';
import { sortOptions } from './extensions/MarketplacePage.constants';
import { marketplaceCardToneClass } from './extensions/MarketplacePage.logic';
import { AppImage } from './MarketplacePage.shared';

type MarketplaceAppListProps = {
  apps: DiscoverAppView[];
  basicCatalogMode?: 'starter' | 'all-safe';
  density?: 'basic' | 'full';
  installingAppId?: string | null;
  modeLabel?: string;
  selectedAppId: string;
  sortBy: string;
  onBasicCatalogModeChange?: (value: 'starter' | 'all-safe') => void;
  onSelect: (appId: string) => void;
  onSortChange: (value: string) => void;
};

export function MarketplaceAppList({ apps, basicCatalogMode, density = 'full', installingAppId = null, modeLabel = 'All apps', selectedAppId, sortBy, onBasicCatalogModeChange, onSelect, onSortChange }: MarketplaceAppListProps) {
  const basic = density === 'basic';
  return (
    <Card className={cn('rounded-lg border-po-border py-0 text-po-text shadow-po-panel', basic ? 'bg-po-surface-soft' : 'bg-po-surface')}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 p-4 md:p-5">
        <div>
          <CardTitle className="text-lg font-bold text-po-text">{modeLabel}</CardTitle>
          <p className="mt-1 text-sm text-po-text-muted">{apps.length} available</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {basicCatalogMode && onBasicCatalogModeChange && (
            <div className="inline-flex rounded-full border border-po-border bg-po-surface-inset p-1" aria-label="Basic catalog view">
              <Button className={cn('h-8 rounded-full px-3 text-xs', basicCatalogMode === 'starter' ? 'bg-po-brand text-sidebar-primary-foreground hover:bg-po-info' : 'bg-transparent text-po-text-muted hover:bg-po-surface-hover hover:text-po-text')} onClick={() => onBasicCatalogModeChange('starter')} size="sm" type="button" variant="ghost">
                Starter apps
              </Button>
              <Button className={cn('h-8 rounded-full px-3 text-xs', basicCatalogMode === 'all-safe' ? 'bg-po-brand text-sidebar-primary-foreground hover:bg-po-info' : 'bg-transparent text-po-text-muted hover:bg-po-surface-hover hover:text-po-text')} onClick={() => onBasicCatalogModeChange('all-safe')} size="sm" type="button" variant="ghost">
                View all apps
              </Button>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className={poButtonClass('quiet')} type="button" variant="outline">
                <SlidersHorizontal className="size-4" />
                {sortBy}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-po-border bg-popover text-popover-foreground">
              <DropdownMenuLabel>Sort apps</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-po-border" />
              <DropdownMenuRadioGroup value={sortBy} onValueChange={onSortChange}>
                {sortOptions.map((option) => (
                  <DropdownMenuRadioItem className="focus:bg-po-surface-hover focus:text-popover-foreground" key={option} value={option}>
                    {option}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className={cn('grid gap-4 p-4 pt-0 md:p-5 md:pt-0', basic ? 'sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2' : 'md:grid-cols-2 2xl:grid-cols-3')}>
        {apps.length ? apps.map((app) => <AppStoreCard app={app} density={density} installing={installingAppId === app.id} isSelected={selectedAppId === app.id} key={app.id} onSelect={() => onSelect(app.id)} />) : (
          <div className="rounded-lg border border-po-border bg-po-surface-soft p-8 text-center text-sm text-po-text-muted sm:col-span-2">No apps match this view.</div>
        )}
      </CardContent>
    </Card>
  );
}

function AppStoreCard({ app, density, installing, isSelected, onSelect }: { app: DiscoverAppView; density: 'basic' | 'full'; installing: boolean; isSelected: boolean; onSelect: () => void }) {
  if (density === 'basic') {
    return <BasicAppStoreCard app={app} installing={installing} isSelected={isSelected} onSelect={onSelect} />;
  }
  const primaryActionId = app.primaryAction.id;
  const actionVariant = primaryActionId === 'review_setup' ? 'default' : 'outline';
  const actionLabel = marketplaceActionLabel(app);
  const primaryDisabled = !installing && app.primaryAction.disabled;
  const primaryDisabledReason = app.primaryAction.reason || 'This app action is not available right now.';
  return (
    <div className={cn('group relative grid min-h-[258px] overflow-hidden rounded-xl border p-4 text-po-text shadow-po-card transition hover:-translate-y-0.5 hover:border-po-info-border', marketplaceCardToneClass(app), isSelected && 'border-po-info-border outline outline-1 outline-po-info/40 shadow-po-info-glow')}>
      <div className="absolute inset-0 bg-po-card-hover-sheen opacity-0 transition group-hover:opacity-100" />
      <button className="relative z-10 grid w-full gap-4 text-left" onClick={onSelect} type="button">
        <span className="flex items-start gap-3">
          <AppImage app={app.app} />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <strong className="truncate text-base text-po-text">{app.name}</strong>
              <Badge className={stateBadgeClass(app.statusTone)} variant="outline">{app.stateLabel}</Badge>
              {installing && <Badge className="gap-1 border-po-info-border bg-po-info-soft text-po-brand" variant="outline"><Loader2 className="size-3 animate-spin" />Installing</Badge>}
            </span>
            <span className="mt-1 block text-xs text-po-text-muted">{app.categoryLabel} · {app.estimatedInstallTime} · {app.difficulty}</span>
          </span>
        </span>

        <span>
          <span className="block text-lg font-black leading-tight text-po-text">{outcomeCopy(app.app)}</span>
          <span className="mt-2 line-clamp-2 block min-h-10 text-sm leading-5 text-po-text-secondary">{app.description}</span>
        </span>
      </button>

      <div className="relative z-10 mt-auto flex items-center justify-between gap-3 border-t border-po-border pt-3">
        <div className="min-w-0 text-xs text-po-text-muted">{app.serviceKindLabel}</div>
        <DisabledAction disabled={primaryDisabled} reason={primaryDisabledReason}>
          <Button className={cn('h-8 px-3 text-xs', primaryActionId === 'review_setup' && 'border-po-info-border bg-po-brand text-sidebar-primary-foreground shadow-po-info-glow hover:bg-po-info', primaryActionId === 'manage' && 'border-po-info-border bg-po-info-soft text-po-brand hover:bg-po-info-soft/80', primaryActionId === 'review_existing' && 'border-po-warning-border bg-po-warning-soft text-po-warning hover:bg-po-warning-soft/80')} disabled={primaryDisabled} onClick={onSelect} type="button" variant={actionVariant}>
            {installing ? <Loader2 className="size-3.5 animate-spin" /> : primaryActionId === 'manage' ? <CheckCircle2 className="size-3.5" /> : <Sparkles className="size-3.5" />}
            {installing ? 'Installing' : actionLabel}
          </Button>
        </DisabledAction>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label={`${app.name} actions`} className={poButtonClass('quietIcon')} size="icon" type="button" variant="outline">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-po-border bg-popover text-popover-foreground">
            <DropdownMenuLabel>{app.name}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-po-border" />
            <DropdownMenuItem className="focus:bg-po-surface-hover focus:text-popover-foreground" onSelect={onSelect}>
              View setup
              <Info className="ml-auto size-4 text-po-text-muted" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function BasicAppStoreCard({ app, installing, isSelected, onSelect }: { app: DiscoverAppView; installing: boolean; isSelected: boolean; onSelect: () => void }) {
  const actionLabel = marketplaceActionLabel(app);
  return (
    <button
      className={cn(
        'group grid min-h-[190px] w-full content-between rounded-xl border border-po-border bg-po-surface p-4 text-left text-po-text shadow-po-card transition',
        'hover:-translate-y-0.5 hover:border-po-info-border hover:bg-po-surface-elevated hover:shadow-po-info-glow',
        isSelected && 'border-po-info-border outline outline-1 outline-po-info/40 shadow-po-info-glow',
      )}
      onClick={onSelect}
      type="button"
    >
      <span className="grid gap-4">
        <span className="flex items-start gap-3">
          <span className="grid size-16 shrink-0 place-items-center rounded-xl border border-po-border bg-po-surface-soft shadow-po-sm">
            <AppImage app={app.app} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-bold text-po-text">{app.name}</span>
            <span className="mt-1 block truncate text-xs font-medium text-po-text-muted">{app.categoryLabel}</span>
            <Badge className={cn('mt-2 rounded-full px-2 py-0.5 text-[0.7rem]', stateBadgeClass(app.statusTone))} variant="outline">
              {app.stateLabel}
            </Badge>
            {installing && (
              <Badge className="mt-2 gap-1 rounded-full border-po-info-border bg-po-info-soft px-2 py-0.5 text-[0.7rem] text-po-brand" variant="outline">
                <Loader2 className="size-3 animate-spin" />
                Installing
              </Badge>
            )}
          </span>
        </span>

        <span className="flex flex-wrap items-center gap-3 text-xs font-medium text-po-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5 text-po-brand" />
            {app.estimatedInstallTime}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="size-3.5 text-po-brand" />
            {app.difficulty}
          </span>
        </span>
      </span>

      <span className="mt-4 grid h-10 place-items-center rounded-lg bg-po-brand px-4 text-sm font-semibold text-sidebar-primary-foreground shadow-po-info-glow transition group-hover:bg-po-info">
        <span className="inline-flex items-center gap-2">
          {installing && <Loader2 className="size-3.5 animate-spin" />}
          {installing ? 'Installing' : actionLabel}
        </span>
      </span>
    </button>
  );
}

function marketplaceActionLabel(app: DiscoverAppView) {
  return app.primaryAction.id === 'review_setup' ? 'Install' : app.primaryAction.label;
}

function stateBadgeClass(tone: string) {
  if (tone === 'success') {
    return 'border-po-success-border bg-po-success-soft text-po-success';
  }
  if (tone === 'warning') {
    return 'border-po-warning-border bg-po-warning-soft text-po-warning';
  }
  if (tone === 'observed') {
    return 'border-po-warning-border bg-po-warning-soft text-po-warning';
  }
  if (tone === 'danger') {
    return 'border-po-danger-border bg-po-danger-soft text-po-danger';
  }
  if (tone === 'neutral') {
    return 'border-po-border bg-po-surface-soft text-po-text-secondary';
  }
  return 'border-po-info-border bg-po-info-soft text-po-brand';
}

function outcomeCopy(app: MarketplaceApp) {
  const known: Record<string, string> = {
    adguard: 'Block ads across your home',
    'adguard-home': 'Block ads across your home',
    gitea: 'Host your own code',
    'home-assistant': 'Control your smart home',
    immich: 'Organize your memories',
    jellyfin: 'Stream anywhere',
    nextcloud: 'Store and share files',
    'obsidian-livesync': 'Sync your notes privately',
    vaultwarden: 'Protect your passwords',
  };
  return known[app.id] || app.shortValue || app.plainLanguage || app.description;
}
