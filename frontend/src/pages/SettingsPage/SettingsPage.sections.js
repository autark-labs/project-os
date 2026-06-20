export const settingsGroups = [
  {
    id: 'general',
    label: 'General',
    description: 'Identity, host behavior, and app defaults',
    sections: ['general', 'system', 'applications'],
  },
  {
    id: 'backups',
    label: 'Backups',
    description: 'Backup schedule, storage, and restore posture',
    sections: ['backups', 'storage'],
  },
  {
    id: 'network',
    label: 'Network',
    description: 'Local links, private access, and security posture',
    sections: ['network', 'remote-access', 'security'],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Update channel and low-level host details',
    sections: ['updates', 'advanced'],
  },
];

export function visibleSettingsGroups(showAdvanced = true) {
  return showAdvanced ? settingsGroups : settingsGroups.filter((group) => group.id !== 'advanced');
}

export function defaultSettingsGroup(groupId) {
  return settingsGroups.some((group) => group.id === groupId) ? groupId : 'general';
}

export function sectionsForGroup(groupId) {
  return settingsGroups.find((group) => group.id === groupId)?.sections ?? settingsGroups[0].sections;
}
