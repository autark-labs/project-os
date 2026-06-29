import { useState } from 'react';
import {
  Download,
  Loader2,
  Pin,
  PinOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { DisabledAction } from '@/components/project-os/DisabledAction';
import { DestructiveActionDialog } from './components/DestructiveActionDialog';
import { ExpandedOperationStatus } from './components/AppOperationStatus';
import { labelForAttention, labelForManagementState, labelForReadiness } from './components/AppStateBadges';
import { ApplicationGuideTab } from './managementTabs/ApplicationGuideTab';
import { ApplicationLinksTab } from './managementTabs/ApplicationLinksTab';
import { ApplicationSettingsTab } from './managementTabs/ApplicationSettingsTab';
import { ApplicationTelemetryTab } from './managementTabs/ApplicationTelemetryTab';
import type { ApplicationActionHandlers, ApplicationSettingsAction, ApplicationSurfaceItem } from './extensions/ApplicationsPage.types';

type ApplicationManagementPanelProps = {
  actions: Pick<ApplicationActionHandlers, 'onDirtyChange' | 'onLoadUninstallPlan' | 'onPinObservedService' | 'onRunUninstall' | 'onSaveSettings' | 'onSettingsPlanRequest' | 'onUnpinObservedService'>;
  item: ApplicationSurfaceItem;
  settingsLoadingAction?: ApplicationSettingsAction | null;
  variant?: 'inline' | 'rail';
};

export function ApplicationManagementPanel({ actions, item, settingsLoadingAction = null, variant = 'inline' }: ApplicationManagementPanelProps) {
  const managed = item.managementState === 'managed';
  const rail = variant === 'rail';
  const recentEvents = item.runtime.recentEvents.slice(0, 5);

  return (
    <section
      className={cn(
        'bg-slate-900 text-slate-50',
        rail
          ? 'min-h-full'
          : 'animate-in fade-in-0 slide-in-from-top-2 rounded-2xl border border-cyan-300/40 shadow-2xl shadow-cyan-950/40',
      )}
    >
      <Tabs className="gap-0" defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto rounded-none border-b border-sky-400/20 bg-slate-900 px-3 py-2" variant="line">
          <TabsTrigger className="px-3 py-2 text-sky-100/60 data-active:text-white" value="overview">Overview</TabsTrigger>
          <TabsTrigger className="px-3 py-2 text-sky-100/60 data-active:text-white" value="guide">Guide</TabsTrigger>
          <TabsTrigger className="px-3 py-2 text-sky-100/60 data-active:text-white" value="settings">Settings</TabsTrigger>
          <TabsTrigger className="px-3 py-2 text-sky-100/60 data-active:text-white" value="telemetry">Telemetry</TabsTrigger>
          <TabsTrigger className="px-3 py-2 text-sky-100/60 data-active:text-white" value="links">Links</TabsTrigger>
          <TabsTrigger className="px-3 py-2 text-sky-100/60 data-active:text-white" value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <div className="p-4">
          <ExpandedOperationStatus item={item} className="mb-4" />

          <TabsContent className="grid gap-4" value="overview">
            <section className="grid gap-2 sm:grid-cols-2">
              <Detail label="State" value={labelForReadiness(item.readinessState)} />
              <Detail label="Attention" value={labelForAttention(item.attentionState)} />
              <Detail label="Container" value={item.settings.containerStatus || item.runtime.health?.dockerStatus || 'Not reported'} />
              <Detail label="Policy" value={managed ? 'Plan before apply' : 'Read only'} />
            </section>

            <ObservedServiceManagementSection actions={actions} item={item} />

            <DangerZone actions={actions} item={item} managed={managed} />
          </TabsContent>

          <TabsContent className="grid gap-4" value="guide">
            <ApplicationGuideTab item={item} />
          </TabsContent>

          <TabsContent className="grid gap-4" value="settings">
            <ApplicationSettingsTab actions={actions} item={item} loadingAction={settingsLoadingAction} />
          </TabsContent>

          <TabsContent className="grid gap-4" value="telemetry">
            <ApplicationTelemetryTab item={item} />
          </TabsContent>

          <TabsContent className="grid gap-4" value="links">
            <ApplicationLinksTab item={item} />
          </TabsContent>

          <TabsContent className="grid gap-4" value="advanced">
            <Accordion className="rounded-xl border border-sky-400/20 bg-slate-800 px-3" collapsible defaultValue="runtime" type="single">
              <AccordionItem value="runtime">
                <AccordionTrigger className="text-sky-50">Runtime details</AccordionTrigger>
                <AccordionContent className="grid gap-2">
                  <Detail label="Compose project" value={item.runtime.composeProject || 'Not reported'} />
                  <Detail label="Runtime path" value={item.runtime.runtimePath || 'Not reported'} />
                  <Detail label="Version" value={item.runtime.version || 'Not reported'} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="template">
                <AccordionTrigger className="text-sky-50">Template values</AccordionTrigger>
                <AccordionContent className="grid gap-2 sm:grid-cols-2">
                  <Detail label="Image" value={item.runtime.image || 'Not reported'} />
                  <Detail label="Category" value={labelForManagementState(item.managementState)} />
                  <Detail label="Port" value={formatPort(item.settings.expectedLocalPort)} />
                  <Detail label="Policy" value={managed ? 'Plan before apply' : 'Read only'} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="events">
                <AccordionTrigger className="text-sky-50">Recent events</AccordionTrigger>
                <AccordionContent className="grid gap-2">
                  {recentEvents.length > 0 ? recentEvents.map((event) => (
                    <ActivityRow key={event.id} label={event.message} value={formatRuntimeTimestamp(event.createdAt)} />
                  )) : (
                    <EmptyActivity item={item} />
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}

function ObservedServiceManagementSection({
  actions,
  item,
}: {
  actions: Pick<ApplicationActionHandlers, 'onPinObservedService' | 'onUnpinObservedService'>;
  item: ApplicationSurfaceItem;
}) {
  const [busyAction, setBusyAction] = useState<'pin' | 'unpin' | null>(null);
  const serviceId = item.sourceId || item.id;
  const pinAction = item.availableActions.find((action) => action.id === 'pin');
  const unpinAction = item.availableActions.find((action) => action.id === 'unpin');
  const installCopyAction = item.availableActions.find((action) => action.id === 'install_copy');
  const isFound = item.managementState === 'found';
  const isLinked = item.managementState === 'linked';

  if (!isFound && !isLinked) {
    return null;
  }

  const canPin = isFound && Boolean(pinAction) && !pinAction?.disabled;
  const canUnpin = isLinked && Boolean(unpinAction) && !unpinAction?.disabled;
  const pinDisabledReason = busyAction
    ? 'Wait for the current service action to finish.'
    : pinAction?.disabled
      ? pinAction.reason || 'Project OS cannot pin this service right now.'
      : !pinAction
        ? 'Project OS cannot pin this service right now.'
        : '';
  const unpinDisabledReason = busyAction
    ? 'Wait for the current service action to finish.'
    : unpinAction?.disabled
      ? unpinAction.reason || 'Project OS cannot unpin this service right now.'
      : !unpinAction
        ? 'Project OS cannot unpin this service right now.'
        : '';

  async function runObservedServiceAction(nextAction: 'pin' | 'unpin') {
    setBusyAction(nextAction);
    try {
      if (nextAction === 'pin') {
        await actions.onPinObservedService(serviceId);
      } else {
        await actions.onUnpinObservedService(serviceId);
      }
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <section className="grid gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-amber-100">{isLinked ? 'Linked service' : 'Found service'}</p>
          <p className="text-xs text-amber-100/70">
            {isLinked ? 'Project OS can open this service but does not manage its runtime.' : 'Project OS found this service on the server.'}
          </p>
        </div>
        <Badge className="border-amber-300/30 bg-slate-900 text-amber-100" variant="outline">
          {isLinked ? 'Linked' : 'Not managed'}
        </Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {isFound && (
          <DisabledAction disabled={!canPin} reason={pinDisabledReason}>
            <Button
              className="border-amber-300/30 bg-slate-900 text-amber-100 hover:bg-slate-800"
              disabled={!canPin}
              onClick={() => void runObservedServiceAction('pin')}
              type="button"
              variant="outline"
            >
              {busyAction === 'pin' ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Pin data-icon="inline-start" />}
              Pin to My Apps
            </Button>
          </DisabledAction>
        )}

        {isLinked && (
          <DisabledAction disabled={!canUnpin} reason={unpinDisabledReason}>
            <Button
              className="border-amber-300/30 bg-slate-900 text-amber-100 hover:bg-slate-800"
              disabled={!canUnpin}
              onClick={() => void runObservedServiceAction('unpin')}
              type="button"
              variant="outline"
            >
              {busyAction === 'unpin' ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <PinOff data-icon="inline-start" />}
              Unpin
            </Button>
          </DisabledAction>
        )}

        {installCopyAction?.href && (
          <Button asChild className="border-amber-300/30 bg-slate-900 text-amber-100 hover:bg-slate-800" variant="outline">
            <Link to={installCopyAction.href}>
              <Download data-icon="inline-start" />
              Install copy
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-900 px-3 py-2">
      <p className="text-xs font-medium text-sky-100/60">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function DangerZone({
  actions,
  item,
  managed,
}: {
  actions: Pick<ApplicationActionHandlers, 'onLoadUninstallPlan' | 'onRunUninstall'>;
  item: ApplicationSurfaceItem;
  managed: boolean;
}) {
  const uninstallReady = managed && item.operationState.kind === 'idle';
  const uninstallDisabledReason = !managed
    ? 'Only managed apps can be uninstalled from Project OS.'
    : !uninstallReady
      ? 'Wait for the current app action to finish before uninstalling.'
      : null;

  return (
    <section className="rounded-xl border border-red-400/25 bg-red-500/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-red-100">Uninstall</p>
          <p className="text-xs text-red-100/70">{managed ? 'Data is preserved by default.' : 'Observed services are not managed.'}</p>
        </div>
        {uninstallDisabledReason ? (
          <DestructiveActionDialog
            className="border-red-300/30 bg-slate-900 text-red-100 hover:bg-red-950"
            disabledReason={uninstallDisabledReason}
            triggerLabel="Review"
          />
        ) : (
          <DestructiveActionDialog
            className="border-red-300/30 bg-slate-900 text-red-100 hover:bg-red-950"
            loadPlan={() => actions.onLoadUninstallPlan(item.id)}
            runAction={() => actions.onRunUninstall(item.id)}
            triggerLabel="Review"
          />
        )}
      </div>
    </section>
  );
}

function ActivityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-sky-400/20 bg-slate-900 px-3 py-2">
      <span className="min-w-0 truncate text-sm text-sky-50">{label}</span>
      <span className="shrink-0 text-xs text-sky-100/60">{value}</span>
    </div>
  );
}

function EmptyActivity({ item }: { item: ApplicationSurfaceItem }) {
  return (
    <div className="rounded-lg border border-sky-400/20 bg-slate-900 px-3 py-2">
      <p className="text-sm font-medium text-sky-50">{item.lastEvent || 'No recent events reported'}</p>
      <p className="mt-1 text-xs text-sky-100/60">
        {item.runtime.checkedAt ? `Last checked ${formatRuntimeTimestamp(item.runtime.checkedAt)}` : 'Project OS has not reported activity for this item.'}
      </p>
    </div>
  );
}

function formatPort(value: number | null) {
  return value ? String(value) : 'Not reported';
}

function formatRuntimeTimestamp(value?: string) {
  if (!value) {
    return 'Not reported';
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}
