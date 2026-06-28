import assert from 'node:assert/strict';
import test from 'node:test';
import { actionNotificationFromResult, notificationToastMethod } from './actionNotifications.logic.js';

test('maps completed app action results to concise success notifications', () => {
  const notification = actionNotificationFromResult({
    action: 'restart',
    status: 'completed',
    message: 'Vaultwarden restarted.',
  }, 'App action finished');

  assert.equal(notification.severity, 'success');
  assert.equal(notification.title, 'App action finished');
  assert.equal(notification.message, 'Vaultwarden restarted.');
  assert.equal(notification.sticky, false);
});

test('maps skipped app action results to info notifications', () => {
  const notification = actionNotificationFromResult({
    action: 'repair',
    status: 'skipped',
    message: 'Vaultwarden already looks ready. No repair was needed.',
  }, 'Repair finished');

  assert.equal(notification.severity, 'info');
  assert.equal(notification.title, 'Repair finished');
  assert.equal(notification.sticky, false);
});

test('maps warning action results to sticky warning notifications', () => {
  const notification = actionNotificationFromResult({
    ok: false,
    severity: 'warning',
    title: 'Confirmation required',
    message: 'Type the confirmation text exactly before Project OS takes control.',
  }, 'Service action finished');

  assert.equal(notification.severity, 'warning');
  assert.equal(notification.title, 'Confirmation required');
  assert.equal(notification.sticky, true);
});

test('maps failed action results to sticky error notifications', () => {
  const notification = actionNotificationFromResult({
    action: 'restart',
    status: 'failed',
    message: 'Vaultwarden could not restart because Docker is unavailable.',
  }, 'App action failed');

  assert.equal(notification.severity, 'error');
  assert.equal(notification.title, 'App action failed');
  assert.equal(notification.sticky, true);
});

test('maps severities to sonner toast methods', () => {
  assert.equal(notificationToastMethod('success'), 'success');
  assert.equal(notificationToastMethod('info'), 'info');
  assert.equal(notificationToastMethod('warning'), 'warning');
  assert.equal(notificationToastMethod('error'), 'error');
  assert.equal(notificationToastMethod('critical'), 'error');
});
