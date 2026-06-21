export function buildDiscoverInstallRequest(answers = {}, options = {}) {
  return {
    answers,
    ...(options.reinstall ? { reinstall: true } : {}),
    ...(options.duplicateAcknowledged ? { duplicateAcknowledged: true } : {}),
  };
}
