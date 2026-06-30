import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = process.cwd();

function source(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

test('shared Project OS components use tempered theme tokens for reusable surfaces', () => {
  const components = source('src/components/project-os/ProjectOSComponents.tsx');

  assert.match(components, /surfaceFrameClass = 'overflow-hidden rounded-lg border border-po-border bg-po-surface text-po-text shadow-po-frame'/);
  assert.match(components, /surfacePanelClass = 'rounded-lg border border-po-border bg-po-surface p-5 text-po-text shadow-po-panel'/);
  assert.match(components, /surfaceInsetClass = 'rounded-lg border border-po-border bg-po-surface-inset p-3 text-sidebar-foreground'/);
  assert.match(components, /primaryButtonClass = 'h-9 rounded-lg border-po-info-border bg-po-brand/);
  assert.match(components, /secondaryButtonClass = 'h-9 rounded-lg border-po-border bg-po-surface-soft/);

  assert.doesNotMatch(components, /violet|purple/i);
  assert.doesNotMatch(components, /bg-slate|border-slate|text-slate|border-white\/10|text-white/);
});

test('shared page states use the same product status token family', () => {
  const pageState = source('src/components/project-os/PageState.tsx');

  assert.match(pageState, /type Tone = 'danger' \| 'info' \| 'neutral' \| 'warning'/);
  assert.match(pageState, /border-po-warning-border bg-po-warning-soft text-po-warning/);
  assert.match(pageState, /border-po-danger-border bg-po-danger-soft text-po-danger/);
  assert.match(pageState, /border-po-info-border bg-po-info-soft text-po-brand/);

  assert.doesNotMatch(pageState, /amber|violet|purple|bg-slate|border-slate|text-slate|border-white\/10|text-white/i);
});

test('disabled controls and job progress render solid readable feedback surfaces', () => {
  const disabledAction = source('src/components/project-os/DisabledAction.tsx');
  const jobProgress = source('src/components/project-os/JobProgress.tsx');

  assert.match(disabledAction, /border-sidebar-border bg-po-sidebar text-sidebar-foreground/);
  assert.match(jobProgress, /border-po-danger-border bg-po-danger-soft text-po-danger/);
  assert.match(jobProgress, /border-po-success-border bg-po-success-soft text-po-success/);
  assert.match(jobProgress, /border-po-info-border bg-po-info-soft text-po-brand/);
  assert.match(jobProgress, /bg-po-surface-inset \[&_\[data-slot=progress-indicator\]\]:bg-po-brand/);

  assert.doesNotMatch(`${disabledAction}\n${jobProgress}`, /bg-slate|border-slate|text-slate|border-white\/10|text-white|bg-sky|text-sky|bg-red|text-red|bg-emerald|text-emerald/i);
});

test('Tailscale control popover uses product status tokens for network state', () => {
  const tailscalePopover = source('src/components/project-os/TailscaleControlPopover.tsx');

  assert.match(tailscalePopover, /border-po-success-border bg-po-success-soft text-po-success/);
  assert.match(tailscalePopover, /border-po-warning-border bg-po-warning-soft text-po-warning/);
  assert.match(tailscalePopover, /border-po-danger-border bg-po-danger-soft text-po-danger/);
  assert.match(tailscalePopover, /border-po-border bg-po-surface-elevated/);
});
