import assert from 'node:assert/strict';
import test from 'node:test';
import { settingsGroups, sectionsForGroup, defaultSettingsGroup, visibleSettingsGroups } from './SettingsPage.sections.js';

test('consolidates settings into four top-level groups', () => {
  assert.deepEqual(settingsGroups.map((group) => group.id), ['general', 'backups', 'network', 'advanced']);
});

test('keeps everyday settings out of the advanced group', () => {
  assert.deepEqual(sectionsForGroup('general'), ['general', 'system', 'applications']);
  assert.deepEqual(sectionsForGroup('backups'), ['backups', 'storage']);
  assert.deepEqual(sectionsForGroup('network'), ['network', 'remote-access', 'security']);
});

test('places low-frequency technical settings in advanced', () => {
  assert.deepEqual(sectionsForGroup('advanced'), ['updates', 'advanced']);
});

test('falls back to the general group for unknown values', () => {
  assert.equal(defaultSettingsGroup('missing'), 'general');
  assert.deepEqual(sectionsForGroup('missing'), ['general', 'system', 'applications']);
});

test('can hide advanced group for simplified views', () => {
  assert.deepEqual(visibleSettingsGroups(false).map((group) => group.id), ['general', 'backups', 'network']);
  assert.deepEqual(visibleSettingsGroups(true).map((group) => group.id), ['general', 'backups', 'network', 'advanced']);
});
