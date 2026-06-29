export type ApplicationRuntimeState = 'running' | 'starting' | 'paused' | 'needs_attention' | 'found' | 'shortcut';
export type ApplicationRuntimeAction = 'start' | 'stop' | 'restart';
export type ApplicationSettingsAction = 'planning' | 'saving';

export type ApplicationNextAction = {
  id: 'create_backup' | 'review_found_service' | 'review_issue' | 'start_app';
  label: string;
  description: string;
};

export type ApplicationSurfaceItem = {
  id: string;
  sourceId?: string;
  name: string;
  kind: 'managed' | 'pinned' | 'observed';
  status: 'Ready' | 'Starting' | 'Paused' | 'Needs review' | 'Found' | 'Pinned';
  runtimeState: ApplicationRuntimeState;
  access: 'Open' | 'Private' | 'Local only' | 'No link';
  backup: 'Protected' | 'Needs backup' | 'Not managed';
  nextAction?: ApplicationNextAction;
  description: string;
  href?: string;
  iconUrl?: string;
  lastEvent?: string;
  links: ApplicationLinksView;
  settings: ApplicationSettingsView;
};

export type ApplicationActionHandlers = {
  onCreateBackup: (id: string) => void;
  onDirtyChange: (id: string, dirty: boolean) => void;
  onRestart: (id: string) => void;
  onRunNextAction: (id: string) => void;
  onSaveSettings: (id: string, values: ApplicationSettingsFormValues) => Promise<void>;
  onSettingsPlanRequest: (id: string, values: ApplicationSettingsFormValues) => Promise<ApplicationSettingsImpact | null>;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
};

export type ApplicationSettingsFormValues = {
  autoRepairEnabled: boolean;
  tailscaleEnabled: boolean;
};

export type ApplicationSettingsImpact = {
  changes: string[];
  restartRequired: boolean;
  saveAllowed: boolean;
  summary: string;
  warnings: string[];
};

export type ApplicationSettingsView = {
  autoRepairEnabled: boolean;
  canEdit: boolean;
  containerDetail: string;
  containerStatus: string;
  desiredAccessMode: string;
  privateAccessRequired: boolean;
  privateAccessUrl?: string;
  privateLinkStatus: string;
  tailscaleEnabled: boolean;
};

export type ApplicationLinksView = {
  backendTargetUrl?: string;
  localUrl?: string;
  primaryUrl?: string;
  privateUrl?: string;
};
