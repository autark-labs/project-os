export function shouldShowActivityLogLink(viewMode, majorActivity) {
  return viewMode === 'advanced' && Array.isArray(majorActivity) && majorActivity.length > 0;
}
