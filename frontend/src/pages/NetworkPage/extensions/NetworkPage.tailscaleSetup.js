export function tailscaleSetupGuidance(tailscale) {
  if (!tailscale?.installed) {
    return {
      tone: 'red',
      title: 'Tailscale is not installed',
      summary: 'Private app links need Tailscale installed on this Project OS host.',
      action: 'Install or reconnect Tailscale from the guided setup.',
      goodState: false,
    };
  }
  if (!tailscale.connected) {
    return {
      tone: 'amber',
      title: 'Sign in to Tailscale',
      summary: tailscale.message || 'Project OS can create private links after this host is signed in to a Tailscale account.',
      action: 'Open the sign-in link or run the guided Tailscale connection step.',
      goodState: false,
    };
  }
  return {
    tone: 'green',
    title: 'Tailscale is connected',
    summary: tailscale.loginName ? `Signed in as ${tailscale.loginName}.` : 'This Project OS host is connected to your Tailscale network.',
    action: tailscale.dnsName ? `Use ${tailscale.dnsName} for private links.` : 'Private links are ready.',
    goodState: true,
  };
}
