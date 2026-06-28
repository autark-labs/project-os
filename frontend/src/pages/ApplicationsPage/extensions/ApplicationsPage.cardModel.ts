import type { AppRuntimeView } from '@/types/app';
import type { ObservedServiceView } from '@/types/observedService';

type PinnedExternalServiceCard = {
  id: string;
  title: string;
  subtitle: string;
  url: string | null;
  status: 'Pinned';
  managementMode: 'pinned_external';
  primaryAction: 'Open';
  secondaryAction: 'Review service';
};

export function pinnedExternalServiceCard(service: Pick<ObservedServiceView, 'accessScope' | 'category' | 'displayName' | 'id' | 'url'> & { name?: string }): PinnedExternalServiceCard {
  return {
    id: service.id,
    title: service.displayName || service.name || 'External service',
    subtitle: `${service.category || 'External'} - ${service.accessScope || 'LAN'}`,
    url: service.url,
    status: 'Pinned',
    managementMode: 'pinned_external',
    primaryAction: 'Open',
    secondaryAction: 'Review service',
  };
}

export function appCardPrimaryUrl(app: AppRuntimeView): string {
  return app.accessRoute?.primaryOpenUrl
    || app.settings?.privateAccessUrl
    || app.observedAccess?.privateUrl
    || app.accessRoute?.localUrl
    || app.observedAccess?.localUrl
    || app.accessUrl
    || app.settings?.accessUrl
    || '';
}
