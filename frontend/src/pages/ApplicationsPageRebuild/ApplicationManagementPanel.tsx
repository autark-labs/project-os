import {
  Download,
  Search,
  ShieldCheck,
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
import { DestructiveActionDialog } from './components/DestructiveActionDialog';
import { ExpandedOperationStatus } from './components/AppOperationStatus';
import { labelForManagementState } from './components/AppStateBadges';
import { ApplicationGuideTab } from './managementTabs/ApplicationGuideTab';
import { ApplicationLinksTab } from './managementTabs/ApplicationLinksTab';
import { ApplicationSettingsTab } from './managementTabs/ApplicationSettingsTab';
import { ApplicationTelemetryTab } from './managementTabs/ApplicationTelemetryTab';
import type { ApplicationActionHandlers, ApplicationSettingsAction, ApplicationSurfaceItem } from './extensions/ApplicationsPage.types';

type ApplicationManagementPanelProps = {
  actions: Pick<ApplicationActionHandlers, 'onDirtyChange' | 'onLoadUninstallPlan' | 'onRunUninstall' | 'onSaveSettings' | 'onSettingsPlanRequest'>;
  item: ApplicationSurfaceItem;
  settingsLoadingAction?: ApplicationSettingsAction | null;
  variant?: 'inline' | 'rail';
};

export function ApplicationManagementPanel({ actions, item, settingsLoadingAction = null, variant = 'inline' }: ApplicationManagementPanelProps) {
  const managed = item.managementState === 'managed';
  const rail = variant === 'rail';
  const mock = appManagementMock(item);

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
              <Detail label="Repair" value={mock.repair} />
              <Detail label="Container" value={mock.container} />
              <Detail label="Storage" value={mock.storage} />
              <Detail label="Policy" value={managed ? 'Plan before apply' : 'Read only'} />
            </section>

            {item.managementState === 'found' && (
              <section className="grid gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-amber-100">Found service</span>
                  <Badge className="border-amber-300/30 bg-slate-900 text-amber-100" variant="outline">Not managed</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Button className="border-amber-300/30 bg-slate-900 text-amber-100 hover:bg-slate-800" type="button" variant="outline">
                    <Search data-icon="inline-start" />
                    Match
                  </Button>
                  <Button className="border-amber-300/30 bg-slate-900 text-amber-100 hover:bg-slate-800" type="button" variant="outline">
                    <ShieldCheck data-icon="inline-start" />
                    Adopt
                  </Button>
                  <Button asChild className="border-amber-300/30 bg-slate-900 text-amber-100 hover:bg-slate-800" variant="outline">
                    <Link to="/discover">
                      <Download data-icon="inline-start" />
                      Install copy
                    </Link>
                  </Button>
                </div>
              </section>
            )}

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
                  <Detail label="Compose project" value={mock.composeProject} />
                  <Detail label="Runtime path" value={mock.runtimePath} />
                  <Detail label="Version" value={mock.version} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="template">
                <AccordionTrigger className="text-sky-50">Template values</AccordionTrigger>
                <AccordionContent className="grid gap-2 sm:grid-cols-2">
                  <Detail label="Image" value={mock.image} />
                  <Detail label="Category" value={labelForManagementState(item.managementState)} />
                  <Detail label="Port" value={mock.port} />
                  <Detail label="Policy" value={managed ? 'Plan before apply' : 'Read only'} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="events">
                <AccordionTrigger className="text-sky-50">Recent events</AccordionTrigger>
                <AccordionContent className="grid gap-2">
                  <ActivityRow label={item.lastEvent || 'State checked'} value="Just now" />
                  <ActivityRow label={`${item.access} access reviewed`} value="Today" />
                  <ActivityRow label={`${item.backup} backup status`} value="Today" />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </div>
      </Tabs>
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

function appManagementMock(item: ApplicationSurfaceItem) {
  const seed = item.id.length;
  return {
    backendTarget: `http://127.0.0.1:${8000 + seed}`,
    composeProject: `project-os-${item.id}`,
    container: item.readinessState === 'ready' ? 'healthy' : item.readinessState === 'paused' || item.readinessState === 'stopped' ? 'stopped' : 'attention',
    image: `${item.id}:stable`,
    localUrl: item.href?.startsWith('http://localhost') ? item.href : `http://localhost:${8000 + seed}`,
    port: String(8000 + seed),
    privateUrl: `https://${item.id}.tailnet.example`,
    repair: item.attentionState !== 'none' ? 'Needs review' : 'Ready',
    runtimePath: `/var/lib/project-os/apps/${item.id}`,
    storage: `${item.id}-data`,
    version: '2026.6',
  };
}
