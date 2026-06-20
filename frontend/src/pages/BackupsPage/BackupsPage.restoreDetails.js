/**
 * @param {import('@/types/backup').RestorePoint} point
 * @param {Array<{ appId: string; appName: string }>} apps
 * @param {import('@/types/backup').RestorePlan | null} plan
 */
export function restorePointDetails(point, apps = [], plan = null) {
  const includedIds = point.includedAppIds.split(',').map((id) => id.trim()).filter(Boolean);
  const includedApps = point.scope === 'full'
    ? apps.filter((app) => includedIds.includes(app.appId)).map((app) => app.appName)
    : [point.appName].filter(Boolean);
  const verification = point.verificationStatus === 'verified'
    ? `Verified with ${point.restoreConfidence || 'unknown'} confidence.`
    : point.verificationStatus === 'failed'
      ? 'Verification failed. Do not restore until this has been reviewed.'
      : 'Not verified yet. Verify before restoring when possible.';

  return {
    title: point.scope === 'full' ? 'Full restore point details' : `${point.appName} restore point details`,
    includedApps,
    verification,
    checksum: point.checksumSha256 || 'No checksum recorded',
    location: point.path,
    restoreSummary: plan?.summary || 'Open restore to preview the exact restore steps.',
    warnings: plan?.warnings?.length ? plan.warnings : defaultWarnings(point),
  };
}

function defaultWarnings(point) {
  const warnings = ['Restoring replaces current app data with the selected restore point.'];
  if (point.verificationStatus !== 'verified') {
    warnings.push('Verify this restore point before restoring if the current app data matters.');
  }
  return warnings;
}
