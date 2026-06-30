import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = process.cwd();

const marketplaceSources = [
  'src/pages/MarketplacePage/DuplicateInstallWarningDialog.tsx',
  'src/pages/MarketplacePage/MarketplaceAppDetail.tsx',
  'src/pages/MarketplacePage/MarketplaceAppList.tsx',
  'src/pages/MarketplacePage/MarketplaceInstallWizard.tsx',
  'src/pages/MarketplacePage/MarketplacePage.shared.tsx',
  'src/pages/MarketplacePage/MarketplacePage.tsx',
  'src/pages/MarketplacePage/MarketplaceSetupPanel.tsx',
  'src/pages/MarketplacePage/extensions/MarketplacePage.logic.js',
];

function source(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

test('Discover surfaces use tempered Project OS tokens instead of legacy page colors', () => {
  const combinedSource = marketplaceSources.map(source).join('\n');

  assert.match(combinedSource, /bg-po-surface/);
  assert.match(combinedSource, /bg-po-info-soft/);
  assert.match(combinedSource, /bg-po-warning-soft/);
  assert.match(combinedSource, /bg-po-success-soft/);
  assert.match(combinedSource, /bg-po-danger-soft/);
  assert.match(combinedSource, /bg-popover/);

  assert.doesNotMatch(combinedSource, /violet|purple/i);
  assert.doesNotMatch(combinedSource, /border-white\/10|bg-black|bg-slate|border-slate|text-slate|text-white/);
  assert.doesNotMatch(combinedSource, /amber-\d|red-\d|emerald-\d|sky-\d/);
  assert.doesNotMatch(combinedSource, /border-sky|bg-sky|text-sky|border-amber|bg-amber|text-amber|border-red|bg-red|text-red|border-emerald|bg-emerald|text-emerald/);
});

test('Discover logic returns semantic tone classes for cards and activity', () => {
  const logic = source('src/pages/MarketplacePage/extensions/MarketplacePage.logic.js');

  assert.match(logic, /success: 'border-po-success-border bg-po-success-soft/);
  assert.match(logic, /info: 'border-po-info-border bg-po-info-soft/);
  assert.match(logic, /observed: 'border-po-warning-border bg-po-warning-soft/);
  assert.match(logic, /return 'text-po-success'/);
  assert.match(logic, /return 'text-po-warning'/);
  assert.match(logic, /return 'text-po-danger'/);
  assert.match(logic, /return 'text-po-brand'/);
});
