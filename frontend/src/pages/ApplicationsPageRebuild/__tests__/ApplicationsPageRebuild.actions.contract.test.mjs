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
  const operations = source('src/pages/ApplicationsPageRebuild/extensions/ApplicationsPage.operations.js');
  const advanced = source('src/pages/ApplicationsPageRebuild/AdvancedApplicationsView.tsx');
  const rail = source('src/pages/ApplicationsPageRebuild/ApplicationDetailsRail.tsx');

  assert.match(page, /InstalledAppsAPIClient\.runAction\(appId, action\)/);
  assert.match(page, /setRuntimeAppStatusInApplicationStateCache\(queryClient, appId, optimisticStatusForAction\(action\)\)/);
  assert.match(page, /setRuntimeAppInApplicationStateCache\(queryClient, data\.app\)/);
  assert.match(page, /invalidateApplicationState\(queryClient\)/);
  assert.match(page, /actionLoadingByAppId/);
  assert.match(page, /useProjectOsJobsQuery\(\)/);
  assert.match(page, /operationStateForItem\(/);
  assert.match(page, /settingsLoadingByAppId\[itemId\]/);
  assert.match(page, /showActionNotification\(data, appActionTitle\(action\)\)/);
  assert.match(page, /showActionErrorNotification\(err, 'App action failed'\)/);
  assert.doesNotMatch(page, /Start requested just now|Pause requested just now|Restart requested just now/);
  assert.match(operations, /kind: 'uninstalling'/);
  assert.match(operations, /kind: 'backing_up'/);
  assert.match(operations, /kind: 'saving_settings'/);
  assert.match(operations, /kind: 'failed'/);
  assert.match(advanced, /actionLoadingByItemId/);
  assert.match(advanced, /item\.operationState\.kind !== 'idle'/);
  assert.match(rail, /actionLoadingByItemId/);
  assert.match(rail, /item\.operationState\.kind !== 'idle'/);
});
