import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const styles = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

function rootValue(name) {
  const match = styles.match(new RegExp(`${name}:\\s*([^;]+);`));
  assert.ok(match, `${name} should be defined`);
  return match[1].trim();
}

test('global project theme uses tempered control-center tokens', () => {
  assert.equal(rootValue('--po-brand'), '#0891b2');
  assert.equal(rootValue('--po-info'), '#22d3ee');
  assert.equal(rootValue('--po-warning'), '#c2410c');
  assert.equal(rootValue('--po-danger'), '#dc2626');
  assert.equal(rootValue('--po-bg-page'), '#93b8ca');
  assert.equal(rootValue('--po-bg-page-soft'), '#c9dfe8');
  assert.equal(rootValue('--po-bg-sidebar'), '#0d1728');
});

test('core theme no longer uses purple as the primary product language', () => {
  const coreTokenBlock = styles.slice(styles.indexOf('/* Project OS design tokens */'), styles.indexOf('@theme inline'));

  assert.doesNotMatch(coreTokenBlock, /--po-brand:\s*#8b5cf6/);
  assert.doesNotMatch(coreTokenBlock, /--po-brand-strong:\s*#a78bfa/);
  assert.doesNotMatch(coreTokenBlock, /--primary:\s*oklch\(0\.59 0\.22 292\)/);
  assert.doesNotMatch(coreTokenBlock, /violet|purple/i);
  assert.doesNotMatch(styles, /violet|purple|#8b5cf6|#a78bfa|139 92 246|124 58 237|88 28 135/i);
});

test('shadcn surfaces inherit the tempered palette', () => {
  assert.equal(rootValue('--background'), 'oklch(0.73 0.045 220)');
  assert.equal(rootValue('--foreground'), 'oklch(0.18 0.035 245)');
  assert.equal(rootValue('--card'), 'oklch(0.88 0.035 220)');
  assert.equal(rootValue('--popover'), 'oklch(0.16 0.035 245)');
  assert.equal(rootValue('--primary'), 'oklch(0.55 0.12 215)');
  assert.equal(rootValue('--ring'), 'oklch(0.68 0.13 210)');
});
