# Tempered Theme Step 1 Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the global Project OS and shadcn theme tokens with the approved Tempered My Apps palette.

**Architecture:** Keep this slice limited to `frontend/src/styles.css` and a focused contract test. Existing components continue using the same `po-*`, shadcn, and Tailwind token names; this pass changes their semantic values without page-level rewrites.

**Tech Stack:** React, Vite, Tailwind v4 CSS tokens, shadcn CSS variables, Node contract tests.

---

### Task 1: Add Theme Token Contract

**Files:**
- Create: `frontend/src/styles.theme.contract.test.mjs`
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: Write the contract test**

Create `frontend/src/styles.theme.contract.test.mjs`:

```js
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
  assert.equal(rootValue('--po-bg-page'), '#a9c8d7');
  assert.equal(rootValue('--po-bg-page-soft'), '#d5e6ee');
  assert.equal(rootValue('--po-bg-sidebar'), '#0d1728');
});

test('core theme no longer uses purple as the primary product language', () => {
  const coreTokenBlock = styles.slice(styles.indexOf('/* Project OS design tokens */'), styles.indexOf('@theme inline'));

  assert.doesNotMatch(coreTokenBlock, /--po-brand:\s*#8b5cf6/);
  assert.doesNotMatch(coreTokenBlock, /--po-brand-strong:\s*#a78bfa/);
  assert.doesNotMatch(coreTokenBlock, /--primary:\s*oklch\(0\.59 0\.22 292\)/);
  assert.doesNotMatch(coreTokenBlock, /violet|purple/i);
});

test('shadcn surfaces inherit the tempered palette', () => {
  assert.equal(rootValue('--background'), 'oklch(0.79 0.045 220)');
  assert.equal(rootValue('--foreground'), 'oklch(0.18 0.035 245)');
  assert.equal(rootValue('--card'), 'oklch(0.88 0.035 220)');
  assert.equal(rootValue('--popover'), 'oklch(0.16 0.035 245)');
  assert.equal(rootValue('--primary'), 'oklch(0.55 0.12 215)');
  assert.equal(rootValue('--ring'), 'oklch(0.68 0.13 210)');
});
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run: `cd frontend && node --test src/styles.theme.contract.test.mjs`

Expected: FAIL because `styles.css` still uses the old purple/dark theme tokens.

- [ ] **Step 3: Rewrite `styles.css` root token values**

Replace the Project OS token values and shadcn token values in `frontend/src/styles.css` with the Tempered My Apps palette:

```css
  --po-bg-app: #0d1728;
  --po-bg-page: #a9c8d7;
  --po-bg-page-soft: #d5e6ee;
  --po-bg-mesh:
    radial-gradient(circle at 18% 0%, rgb(34 211 238 / 0.16), transparent 28rem),
    radial-gradient(circle at 92% 8%, rgb(8 145 178 / 0.12), transparent 24rem),
    linear-gradient(135deg, #a9c8d7 0%, #c1d8e2 48%, #93b8ca 100%);
  --po-bg-sidebar: #0d1728;

  --po-surface-base: #d5e6ee;
  --po-surface-soft: #e4eef3;
  --po-surface-elevated: #f1f7fa;
  --po-surface-inset: #12233a;
  --po-surface-hover: #c5dce7;

  --po-border-subtle: rgb(14 116 144 / 0.2);
  --po-border-strong: rgb(14 116 144 / 0.34);
  --po-border-accent: rgb(34 211 238 / 0.6);

  --po-text-primary: #0f172a;
  --po-text-secondary: #33536a;
  --po-text-muted: #567184;
  --po-text-disabled: #7f98a8;

  --po-brand: #0891b2;
  --po-brand-strong: #22d3ee;
  --po-brand-soft: rgb(34 211 238 / 0.14);
  --po-brand-gradient: linear-gradient(135deg, #0891b2 0%, #0e7490 58%, #22d3ee 100%);

  --po-success: #059669;
  --po-warning: #c2410c;
  --po-danger: #dc2626;
  --po-info: #22d3ee;
  --po-teal: #0f766e;
```

Also update all hero/card/glow/accent and shadcn variables in the same root block so the existing token names stay valid but no longer use the old purple-heavy language.

- [ ] **Step 4: Run token contract**

Run: `cd frontend && node --test src/styles.theme.contract.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run frontend validation**

Run:

```bash
cd frontend
npm run typecheck
npm run build
git diff --check
```

Expected: all commands PASS. The build may still emit existing chunk-size warnings.

