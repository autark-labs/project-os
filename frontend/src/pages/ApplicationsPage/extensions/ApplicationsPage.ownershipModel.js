export function splitOwnershipViews(views = []) {
  return {
    managed: views.filter((view) => view.state === 'installed_managed' && view.installed && view.ownedByCurrentInstance),
    existing: views.filter((view) => ['linked_service', 'found_on_server', 'recoverable', 'managed_elsewhere', 'blocked'].includes(view.state)),
  };
}
