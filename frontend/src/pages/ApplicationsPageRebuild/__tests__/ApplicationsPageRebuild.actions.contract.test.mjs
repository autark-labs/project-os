import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = process.cwd();

function source(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

test('applications rebuild wires managed runtime actions through the shared app API and state cache', () => {
  const page = source('src/pages/ApplicationsPageRebuild/ApplicationsPage.tsx');
  const advanced = source('src/pages/ApplicationsPageRebuild/AdvancedApplicationsView.tsx');
  const rail = source('src/pages/ApplicationsPageRebuild/ApplicationDetailsRail.tsx');

  assert.match(page, /InstalledAppsAPIClient\.runAction\(appId, action\)/);
  assert.match(page, /setRuntimeAppStatusInApplicationStateCache\(queryClient, appId, optimisticStatusForAction\(action\)\)/);
  assert.match(page, /setRuntimeAppInApplicationStateCache\(queryClient, data\.app\)/);
  assert.match(page, /invalidateApplicationState\(queryClient\)/);
  assert.match(page, /actionLoadingByAppId/);
  assert.match(page, /showActionNotification\(data, appActionTitle\(action\)\)/);
  assert.match(page, /showActionErrorNotification\(err, 'App action failed'\)/);
  assert.doesNotMatch(page, /Start requested just now|Pause requested just now|Restart requested just now/);
  assert.match(advanced, /actionLoadingByItemId/);
  assert.match(rail, /actionLoadingByItemId/);
});
