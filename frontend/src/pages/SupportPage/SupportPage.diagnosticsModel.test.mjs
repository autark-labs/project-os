import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnosticsHeadline, diagnosticsSummaryRows, productionConflictSummary } from './SupportPage.diagnosticsModel.js';

test('Diagnostics headline prefers plain Ready and Needs attention states', () => {
  assert.equal(diagnosticsHeadline({ status: 'ready', findings: [] }, { status: 'ready' }), 'Ready');
  assert.equal(diagnosticsHeadline({ status: 'ready', findings: [{ id: 'docker' }] }, { status: 'ready' }), 'Needs attention');
});

test('Diagnostics summary includes apps found on the server without treating owned apps as issues', () => {
  const rows = diagnosticsSummaryRows({
    summary: { dockerStatus: 'Ready', tailscaleStatus: 'Ready', findings: [] },
    doctor: { checks: [{ id: 'docker', status: 'ok' }, { id: 'tailscale', status: 'ok' }] },
    observedServices: [
      { id: 'docker:owned', userStatus: 'installed_managed' },
      { id: 'docker:legacy', userStatus: 'recoverable' },
      { id: 'docker:pinned', userStatus: 'pinned_external' },
    ],
  });

  assert.deepEqual(rows.map((row) => row.label), ['Docker', 'Apps', 'Tailscale', 'Backups', 'Storage']);
  assert.deepEqual(rows.find((row) => row.id === 'apps'), {
    id: 'apps',
    label: 'Apps',
    value: '2 found on this server',
    tone: 'warning',
  });
});

test('Diagnostics copy separates production conflicts from allowed development instances', () => {
  assert.equal(productionConflictSummary({ existingInstall: { conflict: false } }), null);
  assert.equal(productionConflictSummary({ devMode: false, existingInstall: { conflict: true, summary: 'Another install exists.' } }).title, 'Existing Project OS install found');
  assert.equal(productionConflictSummary({ devMode: true, existingInstall: { conflict: false, developmentInstanceAllowed: true, resources: [{ id: 'docker:other' }] } }).title, 'Development instance detected');
});
