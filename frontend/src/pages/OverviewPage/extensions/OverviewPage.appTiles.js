export function managedAppIconUrl(app) {
  return nonBlank(app?.icon) || nonBlank(app?.image) || null;
}

export function observedServiceIconUrl(service) {
  return explicitServiceIcon(service?.metadata)
    || catalogIconUrl(service?.catalogAppId)
    || null;
}

function explicitServiceIcon(metadata = {}) {
  return nonBlank(metadata.iconUrl)
    || nonBlank(metadata.icon)
    || nonBlank(metadata.appIcon)
    || nonBlank(metadata.imageUrl)
    || nonBlank(metadata.catalogImage)
    || null;
}

function catalogIconUrl(catalogAppId) {
  const appId = nonBlank(catalogAppId);
  if (!appId || !/^[a-z0-9][a-z0-9-]*$/.test(appId)) {
    return null;
  }
  return `/app-images/${appId}.svg`;
}

function nonBlank(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
