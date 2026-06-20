export function buildAppIssueGuidance({ access, app, health, reconciliation, telemetry }) {
  const status = health?.status || app.friendlyStatus;
  const privateAccessIssue = reconciliation && !['healthy', 'waiting'].includes(reconciliation.status);
  const linkIssue = access?.status === 'unreachable';
  const resourceIssue = resourceWarning(telemetry);

  if (privateAccessIssue) {
    return {
      tone: 'amber',
      title: 'Private access needs repair',
      summary: reconciliation.detail || reconciliation.message || 'Project OS could not verify this private Tailscale link.',
      nextStep: 'Repair the private link from Network, then reopen this app from a private device.',
      primaryAction: 'repair-private-access',
      primaryLabel: 'Open Network',
      checklist: ['Tailscale must be connected.', 'This app should stay installed.', 'No app data is removed when repairing a private link.'],
      destructiveOptions: [],
    };
  }

  if (status === 'Needs attention' || status === 'Unavailable') {
    return {
      tone: 'red',
      title: `${app.appName} needs a guided fix`,
      summary: health?.detail || health?.message || 'The app is not reaching its expected healthy state.',
      nextStep: 'Restart first. If it returns to this state, create a backup before reinstalling or resetting the app.',
      primaryAction: 'restart',
      primaryLabel: 'Restart app',
      checklist: ['Check the latest failure reason below.', 'Let the restart finish before trying another fix.', 'Create a backup before reinstalling or resetting.'],
      destructiveOptions: [
        {
          label: 'Reinstall with current settings',
          warning: 'Reinstalling should keep the configured data folders, but create a backup first so you have a restore point.',
          target: `/marketplace?app=${encodeURIComponent(app.appId)}&mode=reinstall`,
        },
        {
          label: 'Reset and reinstall',
          warning: 'Reset and reinstall can remove app state. Back up the app first and only use this when you are comfortable rebuilding it.',
          target: `/marketplace?app=${encodeURIComponent(app.appId)}&mode=reset-reinstall`,
        },
      ],
    };
  }

  if (linkIssue) {
    return {
      tone: 'amber',
      title: 'The app is running, but its link is not responding',
      summary: access.message || 'Project OS could not reach the configured app URL.',
      nextStep: 'Restart the app. If the URL was changed outside Project OS, update the app address in Settings.',
      primaryAction: 'restart',
      primaryLabel: 'Restart app',
      checklist: ['Confirm the local address is still correct.', 'Restart before changing app data.', 'Use Settings to update the app URL if needed.'],
      destructiveOptions: [],
    };
  }

  if (resourceIssue) {
    return {
      tone: 'amber',
      title: resourceIssue,
      summary: 'The app is still running, but resource use is high enough to deserve a quick check.',
      nextStep: 'Open the app, review what it is doing, and restart only if it feels stuck.',
      primaryAction: 'none',
      primaryLabel: 'Review app',
      checklist: ['High resource use can be normal during imports or scans.', 'Avoid reinstalling for a temporary resource spike.'],
      destructiveOptions: [],
    };
  }

  return null;
}

function resourceWarning(telemetry) {
  const cpu = percent(telemetry?.cpuPercent);
  const memory = percent(telemetry?.memoryPercent);
  if (typeof cpu === 'number' && cpu >= 85) {
    return 'CPU use is unusually high';
  }
  if (typeof memory === 'number' && memory >= 85) {
    return 'Memory use is unusually high';
  }
  return null;
}

function percent(value) {
  if (!value || value === 'Unavailable') {
    return null;
  }
  const parsed = Number.parseFloat(String(value).replace('%', ''));
  return Number.isNaN(parsed) ? null : Math.max(0, Math.min(100, parsed));
}
