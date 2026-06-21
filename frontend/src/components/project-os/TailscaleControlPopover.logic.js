export function tailscaleControlView(status, check, reconciliation) {
  const mock = status?.state === 'dev' || status?.state === 'mocked_dev' || status?.message?.toLowerCase().includes('mock') || false;
  const connected = Boolean(status?.connected || check?.status === 'ok' || mock);
  const installed = status?.installed ?? check?.status !== 'warning';
  const magicDnsReady = connected && Boolean(status?.dnsName || mock);
  const privateLinksReady = (reconciliation?.apps || []).filter((app) => app.status === 'healthy' || app.expectedPrivateUrl || app.actualPrivateUrl).length;
  const httpsReady = connected && (privateLinksReady > 0 || mock || check?.status === 'ok');
  const serveReady = connected && (reconciliation?.status === 'healthy' || privateLinksReady > 0 || mock || check?.status === 'ok');

  if (mock) {
    return {
      connected: true,
      httpsReady: true,
      label: 'Mock connected',
      magicDnsReady: true,
      mock,
      privateLinksReady,
      serveReady: true,
      summary: 'Development mode is simulating Tailscale.',
      title: 'Tailscale mock connected',
      tone: 'amber',
    };
  }

  if (connected) {
    return {
      connected,
      httpsReady,
      label: 'Signed in',
      magicDnsReady,
      mock,
      privateLinksReady,
      serveReady,
      summary: 'Private links are available for trusted devices on your tailnet.',
      title: 'Tailscale connected',
      tone: 'green',
    };
  }

  return {
    connected: false,
    httpsReady: false,
    label: installed ? 'Not signed in' : 'Missing',
    magicDnsReady: false,
    mock,
    privateLinksReady,
    serveReady: false,
    summary: 'Your apps still work on your home network. Sign in to use private links from trusted devices.',
    title: installed ? 'Tailscale not signed in' : 'Tailscale missing',
    tone: installed ? 'amber' : 'red',
  };
}

export function tailscaleControlActions(status) {
  if (status?.connected || status?.mock) {
    return [
      { id: 'admin', label: 'Manage Tailscale', href: 'https://login.tailscale.com/admin/machines', external: true, enabled: true },
      { id: 'access', label: 'Access settings', href: '/access', external: false, enabled: true },
      { id: 'refresh', label: 'Check again', enabled: true },
      { id: 'copy-hostname', label: 'Copy hostname', enabled: Boolean(status?.dnsName || status?.deviceName) },
    ];
  }

  return [
    { id: 'signin', label: 'Sign in', href: 'https://login.tailscale.com/start', external: true, enabled: true },
    { id: 'access', label: 'Setup instructions', href: '/access', external: false, enabled: true },
    { id: 'refresh', label: 'Check again', enabled: true },
  ];
}
