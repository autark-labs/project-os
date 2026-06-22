import type { AppInstanceView, AppRuntimeView } from './app';
import type { AppOwnershipView } from './appOwnership';
import type { ObservedServiceView } from './observedService';

export type ApplicationState = {
  managedApps: AppInstanceView[];
  runtimeApps: AppRuntimeView[];
  observedServices: ObservedServiceView[];
  pinnedExternalServices: ObservedServiceView[];
  foundServices: ObservedServiceView[];
  ownershipViews: AppOwnershipView[];
  updatedAt: string;
  stale?: boolean;
  refreshStatus?: 'idle' | 'running' | 'failed' | string;
  refreshStartedAt?: string | null;
  refreshCompletedAt?: string | null;
  nextRefreshAt?: string | null;
  lastError?: string | null;
};
