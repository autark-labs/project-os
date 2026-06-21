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
};
