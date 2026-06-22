import assert from 'node:assert/strict';
import test from 'node:test';
import {
  accessByAppId,
  appNeedsAttentionFromCanonicalState,
  applicationStateUpdatedAt,
  displayStatusFromCanonicalState,
  healthByAppId,
  managedRuntimeApps,
  observedServices,
  ownershipViews,
  telemetryByAppId,
} from './applicationStateRepository.logic.js';

const updatedAt = '2026-06-21T12:00:00Z';

test('repository selectors expose canonical app-state slices', () => {
  const state = {
    runtimeApps: [runtimeApp('vaultwarden', 'Ready')],
    observedServices: [{ id: 'docker:found', userStatus: 'found_on_server' }],
    ownershipViews: [{ catalogAppId: 'vaultwarden', state: 'installed_managed' }],
    updatedAt,
  };

  assert.deepEqual(managedRuntimeApps(state).map((app) => app.appId), ['vaultwarden']);
  assert.deepEqual(observedServices(state).map((service) => service.id), ['docker:found']);
  assert.deepEqual(ownershipViews(state).map((view) => view.catalogAppId), ['vaultwarden']);
  assert.equal(applicationStateUpdatedAt(state)?.getTime(), new Date(updatedAt).getTime());
});

test('repository falls back from managed app instances when runtime apps are not present', () => {
  const state = {
    managedApps: [
      {
        catalogAppId: 'homepage',
        name: 'Homepage',
        category: 'Dashboards',
        image: '',
        userStatus: 'Ready',
        runtimeState: 'running',
        accessState: 'local_ready',
        backupState: 'protected_by_restore_point',
        localUrl: 'http://localhost:3005',
        privateUrl: null,
        updatedAt,
      },
    ],
    runtimeApps: [],
  };

  const [app] = managedRuntimeApps(state);

  assert.equal(app.appId, 'homepage');
  assert.equal(app.friendlyStatus, 'Ready');
  assert.equal(app.accessUrl, 'http://localhost:3005');
});

test('ready cached health does not mark every app as needing attention', () => {
  const app = runtimeApp('vaultwarden', 'Ready', health('Ready', 'reachable'));
  const telemetry = telemetryByAppId({ runtimeApps: [app] }).vaultwarden;
  const healthById = healthByAppId({ runtimeApps: [app] });
  const accessById = accessByAppId({ runtimeApps: [app] });

  assert.equal(displayStatusFromCanonicalState(app, healthById.vaultwarden), 'Ready');
  assert.equal(accessById.vaultwarden.status, 'reachable');
  assert.equal(appNeedsAttentionFromCanonicalState(app, healthById.vaultwarden, accessById.vaultwarden, telemetry), false);
});

test('private-link-only health warnings do not make ready apps look globally broken', () => {
  const app = runtimeApp('vaultwarden', 'Ready', {
    ...health('Needs attention', 'reachable'),
    message: 'Private link is not responding.',
    detail: 'Tailscale private access needs repair.',
    privateAccessStatus: 'unreachable',
  });
  const accessById = accessByAppId({ runtimeApps: [app] });

  assert.equal(displayStatusFromCanonicalState(app, app.healthSnapshot), 'Ready');
  assert.equal(accessById.vaultwarden.status, 'reachable');
  assert.equal(appNeedsAttentionFromCanonicalState(app, app.healthSnapshot, accessById.vaultwarden, app.telemetry), false);
});

test('only explicit unhealthy or unreachable states need attention', () => {
  const healthyApp = runtimeApp('vaultwarden', 'Ready', health('Ready', 'reachable'));
  const unhealthyApp = runtimeApp('jellyfin', 'Ready', {
    ...health('Needs attention', 'reachable'),
    dockerStatus: 'Unavailable',
    privateAccessStatus: 'not_configured',
  });
  const unreachableApp = runtimeApp('homepage', 'Ready', health('Ready', 'unreachable'));

  assert.equal(appNeedsAttentionFromCanonicalState(healthyApp, healthyApp.healthSnapshot, accessByAppId({ runtimeApps: [healthyApp] }).vaultwarden, healthyApp.telemetry), false);
  assert.equal(appNeedsAttentionFromCanonicalState(unhealthyApp, unhealthyApp.healthSnapshot, accessByAppId({ runtimeApps: [unhealthyApp] }).jellyfin, unhealthyApp.telemetry), true);
  assert.equal(appNeedsAttentionFromCanonicalState(unreachableApp, unreachableApp.healthSnapshot, accessByAppId({ runtimeApps: [unreachableApp] }).homepage, unreachableApp.telemetry), true);
});

function runtimeApp(appId, friendlyStatus, healthSnapshot = null) {
  return {
    appId,
    appName: appId,
    category: 'Apps',
    description: '',
    version: '',
    image: '',
    friendlyStatus,
    technicalStatus: 'running',
    healthCheck: '',
    runtimePath: '',
    composeProject: '',
    accessUrl: `http://localhost/${appId}`,
    desiredAccess: null,
    observedAccess: { localUrl: `http://localhost/${appId}`, privateUrl: null, localPort: null, protocol: 'http', privateLinkStatus: 'not_configured' },
    installedAt: updatedAt,
    lastBackup: 'Backups disabled',
    settings: null,
    telemetry: {
      cpuPercent: '2%',
      memoryUsage: '128MiB / 1GiB',
      memoryPercent: '12%',
      networkIo: '0B / 0B',
      blockIo: '0B / 0B',
      checkedAt: updatedAt,
    },
    healthSnapshot,
    usageGuide: null,
    setupGuide: null,
    appConfiguration: [],
    recentEvents: [],
    updatedAt,
  };
}

function health(status, localAccessStatus) {
  return {
    appId: 'vaultwarden',
    status,
    message: status,
    detail: '',
    dockerStatus: 'Ready',
    localAccessStatus,
    privateAccessStatus: 'not_configured',
    startupGrace: false,
    checkedAt: updatedAt,
  };
}
