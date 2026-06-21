import type { DiscoverInstalledAppSummary } from './discover';
import type { ExternalService, HostInventoryResource } from './host';

export type AppOwnershipState =
  | 'available'
  | 'installed_managed'
  | 'linked_service'
  | 'found_on_server'
  | 'recoverable'
  | 'managed_elsewhere'
  | 'blocked'
  | 'coming_soon'
  | string;

export type AppOwnershipTone = 'neutral' | 'success' | 'info' | 'warning' | 'danger' | string;

export type AppOwnershipAction = {
  id: string;
  label: string;
  kind: 'route' | 'external' | 'install' | 'disabled' | string;
  href: string | null;
  method: string | null;
  disabled: boolean;
  reason: string;
};

export type AppOwnershipView = {
  catalogAppId: string;
  name: string;
  category: string;
  image: string;
  summary: string;
  description: string;
  state: AppOwnershipState;
  stateLabel: string;
  stateDescription: string;
  statusTone: AppOwnershipTone;
  installed: boolean;
  ownedByCurrentInstance: boolean;
  installCopyWarningRequired: boolean;
  reviewExistingHref: string | null;
  primaryAction: AppOwnershipAction;
  availableActions: AppOwnershipAction[];
  installedApp: DiscoverInstalledAppSummary | null;
  foundResource: HostInventoryResource | null;
  linkedService: ExternalService | null;
};
