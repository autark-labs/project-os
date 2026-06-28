const TERMINAL_ERROR_STATUSES = new Set(['failed', 'error']);
const INFO_STATUSES = new Set(['skipped', 'cancelled', 'canceled']);

export function actionNotificationFromResult(result = {}, fallbackTitle = 'Action finished') {
  const severity = normalizeSeverity(result);
  const title = result.title || fallbackTitle;
  const message = result.message || result.summary || '';
  return {
    severity,
    title,
    message,
    sticky: severity === 'warning' || severity === 'error' || severity === 'critical',
    nextAction: result.nextAction || null,
  };
}

export function notificationToastMethod(severity) {
  if (severity === 'success') return 'success';
  if (severity === 'info') return 'info';
  if (severity === 'warning') return 'warning';
  return 'error';
}

function normalizeSeverity(result) {
  if (typeof result.severity === 'string' && result.severity) {
    return result.severity === 'critical' ? 'error' : result.severity;
  }
  if (result.ok === false) {
    return 'error';
  }
  const status = String(result.status || '').toLowerCase();
  if (TERMINAL_ERROR_STATUSES.has(status)) {
    return 'error';
  }
  if (INFO_STATUSES.has(status)) {
    return 'info';
  }
  return 'success';
}
