import assert from 'node:assert/strict';
import test from 'node:test';
import {
  defaultSetupAnswers,
  installOptionsFromSetupAnswers,
  setupPreviewForApp,
  setupSchemaForApp,
  validateSetupAnswers,
} from './MarketplacePage.setup.js';

function app(overrides = {}) {
  return {
    access: { privateAccessRecommended: false },
    health: { successLabel: 'Ready', type: 'http' },
    id: 'vaultwarden',
    installTime: '2-3 minutes',
    name: 'Vaultwarden',
    runtime: {
      ports: ['8080:80'],
      runtimeRoot: '/srv/project-os/apps/vaultwarden',
      volumes: ['/srv/project-os/apps/vaultwarden/data:/data'],
    },
    usage: { kind: 'web-app', openUrlLabel: 'Open app' },
    ...overrides,
  };
}

test('setupSchemaForApp includes shared setup choices in progressive groups', () => {
  const schema = setupSchemaForApp(app());

  assert.equal(schema.appId, 'vaultwarden');
  assert.deepEqual(
    schema.inputs.map((input) => [input.id, input.group]),
    [
      ['displayName', 'required'],
      ['accessMode', 'recommended'],
      ['storageMode', 'recommended'],
      ['backupPolicy', 'recommended'],
      ['localBrowserPort', 'advanced'],
    ],
  );
});

test('setupSchemaForApp adds app-specific choices for Grafana, Jellyfin, and Pi-hole', () => {
  assert.ok(setupSchemaForApp(app({ id: 'grafana', name: 'Grafana' })).inputs.some((input) => input.id === 'grafanaDataSource'));
  assert.ok(setupSchemaForApp(app({ id: 'jellyfin', name: 'Jellyfin' })).inputs.some((input) => input.id === 'jellyfinMediaFolder'));
  assert.ok(setupSchemaForApp(app({ id: 'pihole', name: 'Pi-hole' })).inputs.some((input) => input.id === 'piholeDnsProvider'));
});

test('defaultSetupAnswers chooses private access when the app recommends it', () => {
  const answers = defaultSetupAnswers(app({
    access: { privateAccessRecommended: true },
    id: 'grafana',
    name: 'Grafana',
  }));

  assert.equal(answers.displayName, 'Grafana');
  assert.equal(answers.accessMode, 'private_lan');
  assert.equal(answers.storageMode, 'project_os_default');
  assert.equal(answers.backupPolicy, 'enabled_first_checkpoint');
  assert.equal(answers.localBrowserPort, 'auto');
  assert.equal(answers.grafanaDataSource, 'start_empty');
});

test('validateSetupAnswers blocks missing conditional paths and invalid custom DNS', () => {
  const jellyfinProblems = validateSetupAnswers(app({ id: 'jellyfin', name: 'Jellyfin' }), {
    ...defaultSetupAnswers(app({ id: 'jellyfin', name: 'Jellyfin' })),
    jellyfinMediaFolder: 'existing_folder',
    jellyfinExistingMediaPath: '',
  });
  const piholeProblems = validateSetupAnswers(app({ id: 'pihole', name: 'Pi-hole' }), {
    ...defaultSetupAnswers(app({ id: 'pihole', name: 'Pi-hole' })),
    piholeDnsProvider: 'custom',
    piholeCustomDns: 'not a dns server',
  });

  assert.deepEqual(jellyfinProblems.map((problem) => problem.fieldId), ['jellyfinExistingMediaPath']);
  assert.deepEqual(piholeProblems.map((problem) => problem.fieldId), ['piholeCustomDns']);
});

test('setupPreviewForApp describes what Project OS will do and surfaces blockers', () => {
  const preview = setupPreviewForApp(app({ id: 'jellyfin', name: 'Jellyfin' }), {
    ...defaultSetupAnswers(app({ id: 'jellyfin', name: 'Jellyfin' })),
    backupPolicy: 'disabled',
    jellyfinMediaFolder: 'existing_folder',
    jellyfinExistingMediaPath: '',
  });

  assert.equal(preview.ready, false);
  assert.match(preview.sections.create.join(' '), /managed folders/i);
  assert.match(preview.sections.connect.join(' '), /LAN/i);
  assert.match(preview.sections.protect.join(' '), /not include/i);
  assert.deepEqual(preview.blockers.map((blocker) => blocker.fieldId), ['jellyfinExistingMediaPath']);
  assert.match(preview.warnings.join(' '), /backup/i);
});

test('installOptionsFromSetupAnswers maps setup choices to existing install options', () => {
  const options = installOptionsFromSetupAnswers(app(), {
    ...defaultSetupAnswers(app()),
    accessMode: 'private_lan',
    backupPolicy: 'disabled',
    localBrowserPort: 8123,
  });

  assert.deepEqual(options, {
    access: { tailscaleEnabled: true },
    backup: { enabled: false, frequency: 'daily', retention: 7 },
    ports: { hostPort: 8123 },
    reinstall: false,
    storage: { subfolders: { data: 'data' } },
  });
});
