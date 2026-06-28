export function buildAccessZones(exposureGroups, pinnedExternalServices = []) {
  return [
    zone('public', 'Public Internet', exposureGroups?.public?.apps || [], 'Public access is off', 'Off'),
    zone('tailnet', 'Private / Tailscale', exposureGroups?.tailnet?.apps || [], 'No private links yet'),
    zone('lan', 'Home Network', [...(exposureGroups?.lan?.apps || []), ...pinnedExternalServices], 'No home network links yet'),
    zone('local', 'This Server', exposureGroups?.local?.apps || [], 'No server-only apps'),
  ];
}

export function zoneAppChip(item) {
  if (item.userStatus === 'pinned_external' || item.pinned) {
    return {
      id: item.id,
      label: item.displayName || item.name,
      url: item.url,
      external: true,
      status: 'Pinned external',
    };
  }
  return {
    id: item.appId,
    label: item.appName,
    url: item.accessRoute?.primaryOpenUrl || item.settings?.privateAccessUrl || item.observedAccess?.privateUrl || item.accessRoute?.localUrl || item.observedAccess?.localUrl || item.accessUrl || item.settings?.accessUrl || '',
    external: false,
    status: item.friendlyStatus || item.canonicalUserStatus || 'Unknown',
  };
}

function zone(id, label, apps, emptyText, emptyStatusLabel = '0') {
  return {
    id,
    label,
    emptyText,
    statusLabel: apps.length ? String(apps.length) : emptyStatusLabel,
    apps: apps.map(zoneAppChip),
  };
}
