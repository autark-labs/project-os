const ACCESS_OPTIONS = [
  {
    value: 'private_lan',
    label: 'Private / Tailscale',
    description: 'Open it from your devices through Project OS private access when available.',
  },
  {
    value: 'lan_only',
    label: 'Home network / LAN',
    description: 'Open it from this network using the app link Project OS creates.',
  },
  {
    value: 'local_only',
    label: 'This server only',
    description: 'Keep access local until you change it later.',
  },
];

const BACKUP_OPTIONS = [
  {
    value: 'enabled_first_checkpoint',
    label: 'Protect it after install',
    description: 'Include the app in Project OS backups and remind me to create a first restore point.',
  },
  {
    value: 'enabled_no_checkpoint',
    label: 'Use routine backups',
    description: 'Include the app in backups without a first-checkpoint reminder.',
  },
  {
    value: 'disabled',
    label: 'Do not include yet',
    description: 'Skip backup protection for now. You can enable it later from Backups.',
  },
];

const STORAGE_OPTIONS = [
  {
    value: 'project_os_default',
    label: 'Project OS managed folder',
    description: 'Use the default managed app folders.',
  },
  {
    value: 'existing_folder',
    label: 'Existing folder',
    description: 'Review or connect an existing folder after install.',
  },
];

export function setupSchemaForApp(app) {
  const inputs = [
    {
      id: 'displayName',
      label: 'App name',
      type: 'text',
      group: 'required',
      required: true,
      help: 'This is how the app appears in Project OS. It does not change the upstream app.',
      defaultValue: app.name,
    },
    {
      id: 'accessMode',
      label: 'How you want to open it',
      type: 'choice',
      group: 'recommended',
      required: true,
      help: 'Project OS can prepare local access now and private access when Tailscale is available.',
      options: ACCESS_OPTIONS,
      defaultValue: app.access?.privateAccessRecommended ? 'private_lan' : 'lan_only',
    },
    {
      id: 'storageMode',
      label: 'Where app data goes',
      type: 'choice',
      group: 'recommended',
      required: true,
      help: 'Managed folders are easiest to back up and recover. Existing folders remain an explicit review step.',
      options: STORAGE_OPTIONS,
      defaultValue: 'project_os_default',
    },
    {
      id: 'backupPolicy',
      label: 'Backup protection',
      type: 'choice',
      group: 'recommended',
      required: true,
      help: 'Project OS can include the app in backups immediately, but a restore point is only real after the first backup completes.',
      options: BACKUP_OPTIONS,
      defaultValue: 'enabled_first_checkpoint',
    },
    ...appSpecificInputs(app),
    {
      id: 'localBrowserPort',
      label: 'Local browser port',
      type: 'number-or-auto',
      group: 'advanced',
      required: false,
      help: 'Leave this on Auto unless another service already uses the suggested port.',
      defaultValue: 'auto',
    },
  ];

  return {
    appId: app.id,
    version: 1,
    inputs,
  };
}

export function defaultSetupAnswers(app) {
  return Object.fromEntries(setupSchemaForApp(app).inputs.map((input) => [input.id, input.defaultValue ?? '']));
}

export function validateSetupAnswers(app, answers) {
  const problems = [];

  if (!String(answers.displayName ?? '').trim()) {
    problems.push({
      fieldId: 'displayName',
      severity: 'error',
      message: 'Give this app a name before installing it.',
    });
  }

  if (answers.storageMode === 'existing_folder' && app.id !== 'jellyfin') {
    problems.push({
      fieldId: 'storageMode',
      severity: 'warning',
      message: 'Existing folders need a review after install before Project OS treats them as protected app data.',
    });
  }

  if (app.id === 'jellyfin' && answers.jellyfinMediaFolder === 'existing_folder' && !String(answers.jellyfinExistingMediaPath ?? '').trim()) {
    problems.push({
      fieldId: 'jellyfinExistingMediaPath',
      severity: 'error',
      message: 'Choose the media folder path to connect after install.',
    });
  }

  if (app.id === 'pihole' && answers.piholeDnsProvider === 'custom' && !validDnsList(String(answers.piholeCustomDns ?? ''))) {
    problems.push({
      fieldId: 'piholeCustomDns',
      severity: 'error',
      message: 'Enter one or more DNS server IP addresses, separated by commas.',
    });
  }

  const port = answers.localBrowserPort;
  if (port !== 'auto' && port !== '' && port != null) {
    const numericPort = Number(port);
    if (!Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65535) {
      problems.push({
        fieldId: 'localBrowserPort',
        severity: 'error',
        message: 'Use Auto or a port from 1 to 65535.',
      });
    }
  }

  return problems;
}

export function setupPreviewForApp(app, answers) {
  const problems = validateSetupAnswers(app, answers);
  const blockers = problems.filter((problem) => problem.severity === 'error');
  const warnings = problems.filter((problem) => problem.severity !== 'error').map((problem) => problem.message);

  if (answers.backupPolicy === 'disabled') {
    warnings.push(`${app.name} will not be included in Project OS backups until you enable it.`);
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
    sections: {
      create: previewCreateItems(app, answers),
      connect: previewConnectItems(app, answers),
      protect: previewProtectItems(app, answers),
      check: previewCheckItems(app, answers),
      afterInstall: previewAfterInstallItems(app, answers),
    },
  };
}

/**
 * @param {import('@/types/marketplace').MarketplaceApp} app
 * @param {Record<string, unknown>} answers
 * @param {import('@/types/marketplace').InstallOptions | null | undefined} fallbackOptions
 */
export function installOptionsFromSetupAnswers(app, answers, fallbackOptions = null) {
  const fallback = fallbackOptions ?? {
    access: { tailscaleEnabled: false },
    backup: { enabled: true, frequency: 'daily', retention: 7 },
    ports: { hostPort: null },
    reinstall: false,
    storage: { subfolders: storageDefaults(app) },
  };
  const localPort = answers.localBrowserPort === 'auto' || answers.localBrowserPort === '' || answers.localBrowserPort == null
    ? null
    : Number(answers.localBrowserPort);

  return {
    ...fallback,
    access: {
      ...(fallback.access ?? {}),
      tailscaleEnabled: answers.accessMode === 'private_lan',
    },
    backup: {
      ...(fallback.backup ?? { frequency: 'daily', retention: 7 }),
      enabled: answers.backupPolicy !== 'disabled',
    },
    ports: {
      ...(fallback.ports ?? {}),
      hostPort: localPort,
    },
    storage: {
      ...(fallback.storage ?? {}),
      subfolders: fallback.storage?.subfolders ?? storageDefaults(app),
    },
    reinstall: Boolean(fallback.reinstall),
  };
}

export function setupSummaryItems(app, answers) {
  return [
    {
      label: 'Name',
      value: String(answers.displayName || app.name),
    },
    {
      label: 'Access',
      value: optionLabel(ACCESS_OPTIONS, answers.accessMode),
    },
    {
      label: 'Storage',
      value: optionLabel(STORAGE_OPTIONS, answers.storageMode),
    },
    {
      label: 'Backups',
      value: optionLabel(BACKUP_OPTIONS, answers.backupPolicy),
    },
    ...appSpecificSummaryItems(app, answers),
  ];
}

function appSpecificInputs(app) {
  if (app.id === 'grafana') {
    return [
      {
        id: 'grafanaDataSource',
        label: 'First dashboard data',
        type: 'choice',
        group: 'app_specific',
        required: true,
        help: 'Grafana can start empty, or Project OS can prepare a connection once a metrics source is installed.',
        defaultValue: 'start_empty',
        options: [
          { value: 'start_empty', label: 'Start empty', description: 'Open Grafana with no preselected data source.' },
          { value: 'prometheus_if_installed', label: 'Use Prometheus if available', description: 'Prepare Prometheus as the first data source when it exists on this server.' },
          { value: 'later', label: 'Decide later', description: 'Install Grafana now and connect data sources from inside Grafana.' },
        ],
      },
    ];
  }

  if (app.id === 'jellyfin') {
    return [
      {
        id: 'jellyfinMediaFolder',
        label: 'Media library',
        type: 'choice',
        group: 'app_specific',
        required: true,
        help: 'Jellyfin can start with an empty media folder or you can connect existing media after install.',
        defaultValue: 'create_new',
        options: [
          { value: 'create_new', label: 'Create a new media folder', description: 'Project OS prepares an empty folder for Jellyfin.' },
          { value: 'existing_folder', label: 'Connect an existing folder', description: 'Review the existing folder path before Project OS connects it.' },
          { value: 'later', label: 'Choose later', description: 'Install Jellyfin first and add libraries later.' },
        ],
      },
      {
        id: 'jellyfinExistingMediaPath',
        label: 'Existing media folder path',
        type: 'path',
        group: 'app_specific',
        required: true,
        showWhen: { jellyfinMediaFolder: 'existing_folder' },
        help: 'Use the host folder path that contains your media files.',
        defaultValue: '',
      },
    ];
  }

  if (app.id === 'pihole') {
    return [
      {
        id: 'piholeDnsProvider',
        label: 'Upstream DNS',
        type: 'choice',
        group: 'app_specific',
        required: true,
        help: 'This is where Pi-hole sends DNS requests after blocking rules are applied.',
        defaultValue: 'cloudflare',
        options: [
          { value: 'cloudflare', label: 'Cloudflare', description: 'Use 1.1.1.1 and 1.0.0.1.' },
          { value: 'quad9', label: 'Quad9', description: 'Use 9.9.9.9 and 149.112.112.112.' },
          { value: 'google', label: 'Google', description: 'Use 8.8.8.8 and 8.8.4.4.' },
          { value: 'custom', label: 'Custom', description: 'Enter your own upstream DNS servers.' },
        ],
      },
      {
        id: 'piholeCustomDns',
        label: 'Custom DNS servers',
        type: 'text',
        group: 'app_specific',
        required: true,
        showWhen: { piholeDnsProvider: 'custom' },
        help: 'Separate multiple DNS server IP addresses with commas.',
        defaultValue: '',
      },
    ];
  }

  return [];
}

function previewCreateItems(app, answers) {
  const items = [
    `Create ${app.name} as a managed Project OS app.`,
    answers.storageMode === 'existing_folder'
      ? 'Prepare managed folders and leave existing-folder connection as a reviewed step.'
      : 'Create managed folders for app data.',
  ];

  if (app.id === 'jellyfin') {
    if (answers.jellyfinMediaFolder === 'create_new') {
      items.push('Create an empty media library folder for Jellyfin.');
    } else if (answers.jellyfinMediaFolder === 'existing_folder') {
      items.push('Prepare Jellyfin to use your existing media folder after review.');
    }
  }

  return items;
}

function previewConnectItems(app, answers) {
  if (answers.accessMode === 'private_lan') {
    return ['Create the local app link and request private Tailscale access when the server is ready.'];
  }
  if (answers.accessMode === 'local_only') {
    return ['Keep access limited to this server until you change it later.'];
  }
  return ['Create a LAN app link for your home network.'];
}

function previewProtectItems(app, answers) {
  if (answers.backupPolicy === 'disabled') {
    return [`Do not include ${app.name} in Project OS backups yet.`];
  }
  if (answers.backupPolicy === 'enabled_no_checkpoint') {
    return [`Include ${app.name} in routine Project OS backups.`];
  }
  return [`Include ${app.name} in Project OS backups and recommend a first restore point after install.`];
}

function previewCheckItems(app, answers) {
  const items = [`Wait for ${app.health?.successLabel || 'the app to report ready'}.`];
  if (answers.localBrowserPort && answers.localBrowserPort !== 'auto') {
    items.push(`Use local port ${answers.localBrowserPort}.`);
  }
  if (app.id === 'grafana' && answers.grafanaDataSource === 'prometheus_if_installed') {
    items.push('Check for Prometheus before preparing a first data source.');
  }
  if (app.id === 'pihole') {
    items.push(`Use ${optionLabel(setupSchemaForApp(app).inputs.find((input) => input.id === 'piholeDnsProvider')?.options ?? [], answers.piholeDnsProvider)} as upstream DNS.`);
  }
  return items;
}

function previewAfterInstallItems(app, answers) {
  const items = [`Open ${app.name} from My Apps.`];
  if (answers.backupPolicy === 'enabled_first_checkpoint') {
    items.push('Create a first backup before making major changes.');
  }
  if (app.usage?.kind === 'companion-service') {
    items.push('Copy connection details for your devices.');
  }
  return items;
}

function appSpecificSummaryItems(app, answers) {
  if (app.id === 'grafana') {
    return [{ label: 'Grafana data', value: optionLabel(setupSchemaForApp(app).inputs.find((input) => input.id === 'grafanaDataSource')?.options ?? [], answers.grafanaDataSource) }];
  }
  if (app.id === 'jellyfin') {
    const items = [{ label: 'Media library', value: optionLabel(setupSchemaForApp(app).inputs.find((input) => input.id === 'jellyfinMediaFolder')?.options ?? [], answers.jellyfinMediaFolder) }];
    if (answers.jellyfinMediaFolder === 'existing_folder') {
      items.push({ label: 'Media path', value: String(answers.jellyfinExistingMediaPath || 'Needs folder path') });
    }
    return items;
  }
  if (app.id === 'pihole') {
    const items = [{ label: 'Upstream DNS', value: optionLabel(setupSchemaForApp(app).inputs.find((input) => input.id === 'piholeDnsProvider')?.options ?? [], answers.piholeDnsProvider) }];
    if (answers.piholeDnsProvider === 'custom') {
      items.push({ label: 'Custom DNS', value: String(answers.piholeCustomDns || 'Needs DNS servers') });
    }
    return items;
  }
  return [];
}

function storageDefaults(app) {
  const runtimeRoot = app.runtime?.runtimeRoot ?? '';
  return Object.fromEntries((app.runtime?.volumes ?? []).map((volume) => {
    const hostPath = volume.split(':')[0] ?? '';
    let relative = hostPath.replace(runtimeRoot, '');
    while (relative.startsWith('/')) {
      relative = relative.slice(1);
    }
    return [relative, relative];
  }).filter(([relative]) => relative));
}

function optionLabel(options, value) {
  return options.find((option) => option.value === value)?.label ?? String(value || 'Not selected');
}

function validDnsList(value) {
  const servers = value.split(',').map((item) => item.trim()).filter(Boolean);
  return servers.length > 0 && servers.every((server) => /^(\d{1,3}\.){3}\d{1,3}$/.test(server) && server.split('.').every((part) => Number(part) >= 0 && Number(part) <= 255));
}
