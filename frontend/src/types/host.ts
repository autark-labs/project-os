export type OwnershipState = 'owned_managed' | 'foreign_project_os' | 'legacy_project_os' | 'external_docker' | 'unknown_conflict' | string;

export type ManagementMode = 'managed' | 'observed' | 'linked' | 'recoverable' | 'conflict' | string;

export type HostInventoryResource = {
  id: string;
  displayName: string;
  catalogAppId: string;
  ownershipState: OwnershipState;
  managementMode: ManagementMode;
  ownerInstanceId: string;
  currentInstanceId: string;
  runtimeState: string;
  accessUrls: string[];
  source: string;
  availableActions: string[];
  ignored: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'info' | string;
  summary: string;
  details: Record<string, string>;
};

export type HostInventoryActionResult = {
  ok: boolean;
  severity: 'success' | 'info' | 'warning' | 'error' | string;
  title: string;
  message: string;
  resourceId: string;
  nextAction: string;
};

export type HostResourceCleanupPlan = {
  resourceId: string;
  displayName: string;
  stopContainers: string[];
  removeContainers: string[];
  freePorts: string[];
  preserveData: string[];
  untouched: string[];
  confirmationText: string;
  warning: string;
};

export type HostResourceDataDeletionPlan = {
  resourceId: string;
  displayName: string;
  paths: string[];
  blockedReasons: string[];
  confirmationText: string;
  warning: string;
};

export type HostResourceRecoveryPlan = {
  resourceId: string;
  displayName: string;
  recoverable: boolean;
  steps: string[];
  blockedReasons: string[];
  confirmationText: string;
};

export type ExternalService = {
  id: string;
  name: string;
  url: string;
  category: string;
  accessScope: string;
  healthCheckEnabled: boolean;
  managementMode: 'linked' | string;
  createdAt: string;
};

export type ExternalServiceRequest = {
  name: string;
  url: string;
  category: string;
  accessScope: string;
  healthCheckEnabled: boolean;
};
