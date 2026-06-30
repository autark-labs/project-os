import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArrowLeft, BookOpen, CheckCircle2, ChevronDown, ExternalLink, Loader2, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DisabledAction } from '@/components/project-os/DisabledAction';
import { JobProgress } from '@/components/project-os/JobProgress';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { backupSafetyWarning } from '@/lib/backupSafety';
import { poButtonClass } from '@/lib/projectOsStyleKit';
import { cn } from '@/lib/utils';
import { currentJobStepText, terminalJob } from '@/repositories/jobRepository';
import type { DiscoverAppView, DiscoverInstalledAppSummary, DiscoverInstallPreview, DiscoverSetupSchema } from '@/types/discover';
import type { ProjectOsJob } from '@/types/jobs';
import type { InstallOptions, InstallPlan, MarketplaceApp } from '@/types/marketplace';
import { InstallWizard } from './MarketplaceInstallWizard';
import { AppImage, InfoCard, Stat, SupportBadge } from './MarketplacePage.shared';
import { DuplicateInstallWarningDialog } from './DuplicateInstallWarningDialog';

type AppDetailProps = {
  app: MarketplaceApp;
  appView: DiscoverAppView;
  backupJob: ProjectOsJob | null;
  installJob: ProjectOsJob | null;
  installOptions: InstallOptions;
  installPlan: InstallPlan | null;
  installLocked: boolean;
  installStatusMessage: string;
  installing: boolean;
  installedApp: DiscoverInstalledAppSummary | null;
  installPreview: DiscoverInstallPreview | null;
  onBack: () => void;
  onCreateBackup: (appId: string) => Promise<void>;
  onDuplicateInstallAcknowledged: () => void;
  onInstall: (options: InstallOptions) => Promise<void>;
  onReinstallCurrent: () => void | Promise<void>;
  onRequestPlan: (options: InstallOptions) => Promise<void>;
  onSetupAnswersChange: (answers: Record<string, unknown>) => void;
  planLoading: boolean;
  recoveryMode?: string | null;
  setupAnswers: Record<string, unknown>;
  setupReady: boolean;
  setupSchema: DiscoverSetupSchema;
};

export function MarketplaceAppDetail({ app, appView, backupJob, installJob, installedApp, installLocked, installOptions, installPlan, installPreview, installStatusMessage, installing, onBack, onCreateBackup, onDuplicateInstallAcknowledged, onInstall, onReinstallCurrent, onRequestPlan, onSetupAnswersChange, planLoading, recoveryMode, setupAnswers, setupReady, setupSchema }: AppDetailProps) {
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [installReviewOpen, setInstallReviewOpen] = useState(false);
  const isInstalled = Boolean(installedApp);
  const needsExistingServiceReview = !isInstalled && appView.installCopyWarningRequired;
  const installDisabled = installing || installLocked || !setupReady;
  const installDisabledReason = installing
    ? `${app.name} is already installing.`
    : installLocked
      ? installStatusMessage || 'Another install is active.'
      : 'Finish the required install choices before installing.';

  function openInstallReview() {
    setInstallReviewOpen(true);
    void onRequestPlan(installOptions);
  }

  function openDuplicateWarning() {
    setDuplicateWarningOpen(true);
  }

  function acknowledgeDuplicateInstall() {
    onDuplicateInstallAcknowledged();
    openInstallReview();
  }

  return (
    <Card className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-lg border-po-border bg-po-surface text-po-text shadow-po-panel">
      <CardContent className="grid gap-5 p-5">
        <Button className={poButtonClass('quiet', 'w-fit')} onClick={onBack} type="button" variant="outline">
          <ArrowLeft className="size-4" />
          Back to apps
        </Button>

        <div className="grid gap-4 sm:grid-cols-[88px_minmax(0,1fr)]">
          <AppImage app={app} size="large" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-2xl font-bold text-po-text">{app.name}</h3>
              <Badge className={stateBadgeClass(appView.statusTone)} variant="outline">{appView.stateLabel}</Badge>
              <SupportBadge level={app.supportLevel} />
            </div>
            <p className="mt-2 text-sm text-po-text-secondary">{app.description}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-po-text-muted">
              <span>{app.category}</span>
              <span>{app.difficulty}</span>
              <span>{app.installTime}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {app.tags.map((tag) => <Badge className="border-po-border bg-po-surface-soft text-po-text-secondary" key={tag} variant="outline">{tag}</Badge>)}
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          {isInstalled ? (
            <Button asChild className="bg-po-success text-sidebar-primary-foreground hover:bg-po-success/90">
              <Link to="/apps">
                <CheckCircle2 className="size-4" />
                View in My Apps
              </Link>
            </Button>
          ) : needsExistingServiceReview ? (
            <>
              {appView.reviewExistingHref ? (
                <Button asChild className="bg-po-warning text-sidebar-primary-foreground hover:bg-po-warning/90">
                  <Link to={appView.reviewExistingHref}>
                    <TriangleAlert className="size-4" />
                    Review existing service
                  </Link>
                </Button>
              ) : (
                <DisabledAction disabled reason="Project OS cannot open the existing service review yet. Refresh existing apps and try again.">
                  <Button className="bg-po-warning text-sidebar-primary-foreground" disabled type="button">
                    <TriangleAlert className="size-4" />
                    Review existing service
                  </Button>
                </DisabledAction>
              )}
              <DisabledAction disabled={installDisabled} reason={installDisabledReason}>
                <Button className={poButtonClass('quiet')} disabled={installDisabled} onClick={openDuplicateWarning} type="button" variant="outline">
                  Install second copy
                </Button>
              </DisabledAction>
            </>
          ) : (
            <DisabledAction disabled={installDisabled} reason={installDisabledReason}>
              <Button className={poButtonClass('primary')} disabled={installDisabled} onClick={openInstallReview} type="button">
                {installing ? <Loader2 className="size-4 animate-spin" /> : null}
                {installing ? 'Installing...' : installLocked ? 'Install blocked' : !setupReady ? 'Finish install choices' : 'Install'}
              </Button>
            </DisabledAction>
          )}
          <DocsSourceMenu app={app} />
          {!isInstalled && <InstallWizard app={app} hideTrigger installLocked={installLocked || !setupReady} installOptions={installOptions} installPlan={installPlan} installPreview={installPreview} installStatusMessage={!setupReady ? 'Finish the required install choices before installing.' : installStatusMessage} installing={installing} onInstall={onInstall} onOpenChange={setInstallReviewOpen} onRequestPlan={onRequestPlan} onSetupAnswersChange={onSetupAnswersChange} open={installReviewOpen} planLoading={planLoading} setupAnswers={setupAnswers} setupSchema={setupSchema} />}
        </div>

        {installLocked && <InstallBlockedNotice message={installStatusMessage} />}
        {needsExistingServiceReview && <ExistingServiceNotice appView={appView} />}
        {requiresInstallCaution(app) && !isInstalled && <InstallCautionNotice app={app} />}
        <DuplicateInstallWarningDialog appName={app.name} onInstallCopy={acknowledgeDuplicateInstall} onOpenChange={setDuplicateWarningOpen} open={duplicateWarningOpen} reviewHref={appView.reviewExistingHref} />
        {isInstalled && <InstalledAppNotice app={installedApp} />}
        {isInstalled && recoveryMode && recoveryMode !== 'reset-reinstall' && (
          <RecoveryInstallNotice
            disabled={installLocked || installing}
            mode={recoveryMode}
            onReinstallCurrent={onReinstallCurrent}
          />
        )}
        {(installJob || backupJob || installing) && <InlineInstallStatus app={app} backupJob={backupJob} installedApp={installedApp} installing={installing} job={installJob} onCreateBackup={onCreateBackup} />}

        <section className="rounded-lg border border-po-border bg-po-surface-soft p-4">
          <h4 className="font-bold text-po-text">About</h4>
          <p className="mt-2 text-sm leading-6 text-po-text-secondary">{app.plainLanguage}</p>
        </section>

        <div className="grid gap-4">
          <InfoCard title="Key features" items={app.highlights} />
          <InfoCard title="Best for" items={app.bestFor} />
        </div>

        <section className="rounded-lg border border-po-border bg-po-surface-soft p-4">
          <h4 className="font-bold text-po-text">App details</h4>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat label="Version" value={app.version || 'Unavailable'} />
            <Stat label="Size" value={app.size || 'Unavailable'} />
            <Stat label="Last updated" value={app.lastUpdated || 'Unavailable'} />
            <Stat label="Source" value={app.source || 'Unavailable'} />
            <Stat label="Maintainer" value={app.maintainer || 'Unavailable'} />
            <Stat label="Downloads" value={app.downloads || 'Unavailable'} />
          </div>
        </section>

        <Collapsible className="rounded-lg border border-po-border bg-po-surface-soft p-4">
          <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-3 text-left font-bold text-po-text">
            Advanced app info
            <ChevronDown className="size-4 text-po-text-muted" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 grid gap-4">
              {app.technicalSummary && <p className="text-sm leading-6 text-po-text-secondary">{app.technicalSummary}</p>}
              {app.requirements.length > 0 && <InfoCard title="Requirements" items={app.requirements} />}
              {app.includes.length > 0 && <InfoCard title="Included services" items={app.includes} />}
              {app.usage.notes.length > 0 && <InfoCard title="Good to know" items={app.usage.notes} />}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function DocsSourceMenu({ app }: { app: MarketplaceApp }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={poButtonClass('quiet')} type="button" variant="outline">
          Docs + source
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 border-po-border bg-popover text-popover-foreground">
        <DropdownMenuLabel>{app.name}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-po-border" />
        {app.sourceUrl ? (
          <DropdownMenuItem asChild className="focus:bg-po-surface-hover focus:text-popover-foreground">
            <a href={app.sourceUrl} rel="noreferrer" target="_blank">
              <ExternalLink className="mr-2 size-4" />
              View source
              <span className="ml-auto text-xs text-po-text-muted">{app.source}</span>
            </a>
          </DropdownMenuItem>
        ) : (
          <DisabledAction className="w-full" disabled reason="This catalog app does not publish a source URL yet.">
            <DropdownMenuItem className="focus:bg-po-surface-hover focus:text-popover-foreground" disabled>
              View source
              <span className="ml-auto text-xs text-po-text-muted">Unavailable</span>
            </DropdownMenuItem>
          </DisabledAction>
        )}
        {app.documentationUrl ? (
          <DropdownMenuItem asChild className="focus:bg-po-surface-hover focus:text-popover-foreground">
            <a href={app.documentationUrl} rel="noreferrer" target="_blank">
              <BookOpen className="mr-2 size-4" />
              Read docs
              <span className="ml-auto text-xs text-po-text-muted">External</span>
            </a>
          </DropdownMenuItem>
        ) : (
          <DisabledAction className="w-full" disabled reason="This catalog app does not publish documentation yet.">
            <DropdownMenuItem className="focus:bg-po-surface-hover focus:text-popover-foreground" disabled>
              Read docs
              <span className="ml-auto text-xs text-po-text-muted">Unavailable</span>
            </DropdownMenuItem>
          </DisabledAction>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InstallCautionNotice({ app }: { app: MarketplaceApp }) {
  return (
    <section className="rounded-lg border border-po-warning-border bg-po-warning-soft p-4">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-po-warning" />
        <div>
          <h4 className="font-bold text-po-text">Review before installing</h4>
          <p className="mt-1 text-sm leading-6 text-po-text-secondary">{app.supportSummary}</p>
        </div>
      </div>
    </section>
  );
}

function ExistingServiceNotice({ appView }: { appView: DiscoverAppView }) {
  return (
    <section className="rounded-lg border border-po-warning-border bg-po-warning-soft p-4 text-sm text-po-warning">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-po-warning" />
        <div>
          <h4 className="font-bold text-current">{appView.stateLabel}</h4>
          <p className="mt-1 leading-6 text-current/80">{appView.stateDescription}</p>
          <p className="mt-2 leading-6 text-current/80">Project OS already sees this app on your system. Installing another copy can cause confusing behavior across your network, especially from phones, TVs, or other devices that discover services automatically. Pin or adopt the existing service when possible. Install a second copy only if you intentionally want two separate instances.</p>
          {appView.reviewExistingHref && (
            <Button asChild className="mt-3" size="sm" variant="outline">
              <Link to={appView.reviewExistingHref}>Review existing service</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function stateBadgeClass(tone: string) {
  if (tone === 'success') return 'border-po-success-border bg-po-success-soft text-po-success';
  if (tone === 'warning') return 'border-po-warning-border bg-po-warning-soft text-po-warning';
  if (tone === 'danger') return 'border-po-danger-border bg-po-danger-soft text-po-danger';
  if (tone === 'info') return 'border-po-info-border bg-po-info-soft text-po-brand';
  if (tone === 'observed') return 'border-po-warning-border bg-po-warning-soft text-po-warning';
  return 'border-po-border bg-po-surface-soft text-po-text-secondary';
}

function InstallBlockedNotice({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-po-warning-border bg-po-warning-soft p-4 text-sm text-po-warning">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-po-warning" />
        <div>
          <h4 className="font-bold text-current">Another install is active</h4>
          <p className="mt-1 leading-6 text-current/80">{message}</p>
        </div>
      </div>
    </section>
  );
}

function RecoveryInstallNotice({ disabled, mode: _mode, onReinstallCurrent }: { disabled: boolean; mode: string; onReinstallCurrent: () => void | Promise<void> }) {
  return (
    <section className="rounded-lg border border-po-warning-border bg-po-warning-soft p-4">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-po-warning" />
        <div className="min-w-0">
          <h4 className="font-bold text-po-text">Reinstall requested</h4>
          <p className="mt-1 text-sm leading-6 text-po-text-secondary">
            {backupSafetyWarning('reinstall')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild className={poButtonClass('quiet')} size="sm" type="button" variant="outline">
              <Link to="/backups">
                <Archive className="size-3.5" />
                Open Backups
              </Link>
            </Button>
            <DisabledAction disabled={disabled} reason="Wait for the active install or reinstall job to finish.">
              <Button className="bg-po-warning text-sidebar-primary-foreground hover:bg-po-warning/90" disabled={disabled} onClick={onReinstallCurrent} size="sm" type="button">
                I backed up, reinstall
              </Button>
            </DisabledAction>
          </div>
        </div>
      </div>
    </section>
  );
}

function InstalledAppNotice({ app }: { app: DiscoverInstalledAppSummary | null }) {
  if (!app) {
    return null;
  }
  return (
    <section className="rounded-lg border border-po-success-border bg-po-success-soft p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 text-po-success" />
        <div className="min-w-0">
          <h4 className="font-bold text-po-text">Already installed</h4>
          <p className="mt-1 text-sm text-po-text-secondary">{app.appName} is already managed by Project OS. Use My Apps for day-to-day settings, repairs, and app status.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {app.accessUrl && (
              <Button asChild className="bg-po-success text-sidebar-primary-foreground hover:bg-po-success/90" size="sm">
                <a href={app.accessUrl} rel="noreferrer" target="_blank">Open app</a>
              </Button>
            )}
            <Button asChild className={poButtonClass('quiet')} size="sm" variant="outline">
              <Link to="/apps">Manage in My Apps</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function InlineInstallStatus({
  app,
  backupJob,
  installedApp,
  installing,
  job,
  onCreateBackup,
}: {
  app: MarketplaceApp;
  backupJob: ProjectOsJob | null;
  installedApp: DiscoverInstalledAppSummary | null;
  installing: boolean;
  job: ProjectOsJob | null;
  onCreateBackup: (appId: string) => Promise<void>;
}) {
  if (job) {
    const running = !terminalJob(job);
    const succeeded = job.status === 'succeeded';
    const failed = job.status === 'failed';
    return (
      <section className={cn('rounded-lg border p-4', succeeded ? 'border-po-success-border bg-po-success-soft' : failed ? 'border-po-danger-border bg-po-danger-soft' : 'border-po-info-border bg-po-info-soft')}>
        <div className="flex items-start gap-3">
          {running ? <Loader2 className="mt-0.5 size-5 animate-spin text-po-brand" /> : succeeded ? <CheckCircle2 className="mt-0.5 size-5 text-po-success" /> : <TriangleAlert className="mt-0.5 size-5 text-po-danger" />}
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-po-text">{succeeded ? `${app.name} is ready` : failed ? `${app.name} did not finish installing` : `Installing ${app.name}`}</h4>
            <p className={cn('mt-1 text-sm', succeeded ? 'text-po-success' : failed ? 'text-po-danger' : 'text-po-brand')}>
              {succeeded ? 'Open the app now, or create a first restore point before changing settings.' : failed ? job.error?.message || 'Project OS stopped before making this app available.' : currentJobStepText(job, 'Project OS is working on this job.')}
            </p>
            {running && <JobProgress className="mt-4" job={job} subjectLabel={app.name} />}
            <JobStepList job={job} />
            {succeeded && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(installedApp?.accessUrl || app.accessUrl) && (
                  <Button asChild className="bg-po-success text-sidebar-primary-foreground hover:bg-po-success/90" size="sm">
                    <a href={installedApp?.accessUrl || app.accessUrl} rel="noreferrer" target="_blank">Open {app.name}</a>
                  </Button>
                )}
                {installedApp && shouldOfferFirstBackup(installedApp) && (
                  <DisabledAction disabled={backupJob ? !terminalJob(backupJob) : false} reason="Project OS is already creating the first backup for this app.">
                    <Button className={poButtonClass('quiet')} disabled={backupJob ? !terminalJob(backupJob) : false} onClick={() => onCreateBackup(installedApp.appId)} size="sm" type="button" variant="outline">
                      {backupJob && !terminalJob(backupJob) ? <Loader2 className="size-3.5 animate-spin" /> : <Archive className="size-3.5" />}
                      {backupJob?.status === 'succeeded' ? 'Backup created' : backupJob && !terminalJob(backupJob) ? 'Creating backup' : 'Create first backup'}
                    </Button>
                  </DisabledAction>
                )}
                <Button asChild className={poButtonClass('quiet')} size="sm" variant="outline">
                  <Link to="/apps">View in My Apps</Link>
                </Button>
              </div>
            )}
            {failed && (
              <Collapsible className="mt-4 rounded-lg border border-po-danger-border bg-po-surface-soft p-3 text-sm text-po-danger">
                <CollapsibleTrigger className="w-full cursor-pointer text-left font-semibold text-po-text">View details</CollapsibleTrigger>
                <CollapsibleContent>
                <div className="mt-2 grid gap-1">
                  {job.steps.map((step) => <p key={step.id}>{step.label}: {step.message || step.status}</p>)}
                </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (installing) {
    return (
      <section className="rounded-lg border border-po-info-border bg-po-info-soft p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-po-brand" />
          <div>
            <h4 className="font-bold text-po-text">Installing with safe defaults</h4>
            <p className="mt-1 text-sm text-po-text-secondary">Project OS is creating storage, choosing the saved access settings, and starting the app.</p>
          </div>
        </div>
      </section>
    );
  }

  return null;
}

function JobStepList({ job }: { job: ProjectOsJob }) {
  return (
    <div className="mt-4 grid gap-2">
      {job.steps.map((step) => (
        <div className="flex items-start gap-2 text-sm" key={step.id}>
          <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[0.65rem] font-bold', step.status === 'succeeded' ? 'border-po-success-border bg-po-success-soft text-po-success' : step.status === 'failed' ? 'border-po-danger-border bg-po-danger-soft text-po-danger' : step.status === 'running' ? 'border-po-info-border bg-po-info-soft text-po-brand' : 'border-po-border bg-po-surface-soft text-po-text-muted')}>
            {step.status === 'succeeded' ? 'ok' : step.status === 'failed' ? '!' : step.status === 'running' ? '...' : ''}
          </span>
          <span>
            <span className="block font-semibold text-po-text">{step.label}</span>
            {step.message && <span className="block leading-5 text-po-text-muted">{step.message}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

function shouldOfferFirstBackup(_app: DiscoverInstalledAppSummary) {
  return true;
}

function CatalogConfidenceCard({ app }: { app: MarketplaceApp }) {
  return (
    <section className="rounded-lg border border-po-border bg-po-surface-soft p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-po-text">Catalog confidence</h4>
          <p className="mt-1 text-sm leading-6 text-po-text-muted">{app.supportSummary}</p>
        </div>
        <SupportBadge level={app.supportLevel} />
      </div>
      <div className="mt-4 grid gap-2">
        {app.smokeTests.map((test) => (
          <div className="grid gap-2 rounded-lg border border-po-border bg-po-surface p-3 sm:grid-cols-[minmax(160px,0.7fr)_minmax(140px,0.6fr)_1fr]" key={test.label}>
            <span className="font-semibold text-po-text-secondary">{test.label}</span>
            <span className={cn('text-sm font-semibold', smokeStatusTone(test.status))}>{test.status}</span>
            <span className="text-sm leading-5 text-po-text-muted">{test.detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function smokeStatusTone(status: string) {
  switch (status) {
    case 'Passed':
      return 'text-po-success';
    case 'Blocked':
      return 'text-po-danger';
    case 'Not applicable':
      return 'text-po-text-muted';
    default:
      return 'text-po-warning';
  }
}

function requiresInstallCaution(app: MarketplaceApp) {
  return ['Advanced', 'Needs testing', 'Experimental'].includes(app.supportLevel);
}

function serviceKindLabel(kind: string) {
  const labels: Record<string, string> = {
    'web-app': 'App you open',
    'companion-service': 'Service you connect to',
    'admin-service': 'Setup tool',
    'background-service': 'Background service',
    infrastructure: 'Infrastructure',
  };
  return labels[kind] || kind.replaceAll('-', ' ');
}
