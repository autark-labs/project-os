import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = process.cwd();

function source(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

test('app shell hides desktop sidebar on mobile and renders a compact mobile app bar', () => {
  const appShell = source('src/layout/AppShell.tsx');

  assert.match(appShell, /<MobileAppBar\s*\/>/);
  assert.match(appShell, /className="hidden lg:block"/);
  assert.match(appShell, /<Sidebar collapsed=\{sidebarCollapsed\} onToggleCollapse=\{toggleSidebar\} \/>/);
});

test('mobile app bar uses an accessible sheet navigation drawer', () => {
  const mobileAppBar = source('src/layout/MobileAppBar.tsx');

  assert.match(mobileAppBar, /lg:hidden/);
  assert.match(mobileAppBar, /<Sheet/);
  assert.match(mobileAppBar, /<SheetContent[^>]+side="left"/);
  assert.match(mobileAppBar, /<SheetTitle/);
  assert.match(mobileAppBar, /<SheetDescription/);
  assert.match(mobileAppBar, /aria-label="Open navigation"/);
  assert.match(mobileAppBar, /navigationGroups\(viewMode\)/);
});
