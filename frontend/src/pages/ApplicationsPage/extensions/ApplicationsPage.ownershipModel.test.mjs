import assert from 'node:assert/strict';
import test from 'node:test';
import { splitOwnershipViews } from './ApplicationsPage.ownershipModel.js';

test('splitOwnershipViews separates managed apps from existing services', () => {
  const split = splitOwnershipViews([
    { catalogAppId: 'vaultwarden', state: 'installed_managed', installed: true, ownedByCurrentInstance: true },
    { catalogAppId: 'jellyfin', state: 'linked_service', installed: false, ownedByCurrentInstance: false },
    { catalogAppId: 'homepage', state: 'recoverable', installed: false, ownedByCurrentInstance: false },
    { catalogAppId: 'foreign', state: 'managed_elsewhere', installed: false, ownedByCurrentInstance: false },
  ]);

  assert.deepEqual(split.managed.map((view) => view.catalogAppId), ['vaultwarden']);
  assert.deepEqual(split.existing.map((view) => view.catalogAppId), ['jellyfin', 'homepage', 'foreign']);
});
