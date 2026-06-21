import assert from 'node:assert/strict';
import test from 'node:test';
import { appCardPrimaryUrl, pinnedExternalServiceCard } from './ApplicationsPage.cardModel.js';

test('pinned external services get a distinct card model without managed runtime actions', () => {
  const card = pinnedExternalServiceCard({
    accessScope: 'LAN',
    category: 'Network',
    id: 'obs_router',
    displayName: 'Router',
    url: 'http://192.168.1.1',
  });

  assert.equal(card.managementMode, 'pinned_external');
  assert.equal(card.status, 'Pinned');
  assert.equal(card.primaryAction, 'Open');
  assert.equal(card.secondaryAction, 'Review service');
});

test('app cards prefer private links before local links', () => {
  assert.equal(appCardPrimaryUrl({
    accessUrl: 'http://localhost:8080',
    observedAccess: { privateUrl: 'https://vault.tailnet', localUrl: 'http://192.168.1.5:8080' },
    settings: {},
  }), 'https://vault.tailnet');
});
