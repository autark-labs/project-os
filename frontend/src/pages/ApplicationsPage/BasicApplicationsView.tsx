import { Search } from 'lucide-react';
import { ProjectEmptyState } from '@/components/primitives/EmptyState';
import { ApplicationCard } from './components/ApplicationCard';
import type { ApplicationEmptyState, ApplicationSurfaceItem } from './extensions/ApplicationsPage.types';

type BasicApplicationsViewProps = {
  emptyState: ApplicationEmptyState;
  items: ApplicationSurfaceItem[];
  managementOpen: boolean;
  onSelect: (id: string) => void;
  selectedId?: string;
};

export function BasicApplicationsView({ emptyState, items, managementOpen, onSelect, selectedId }: BasicApplicationsViewProps) {
  if (!items.length) {
    return <ApplicationsEmptyState emptyState={emptyState} />;
  }

  return (
    <section className="grid min-h-[44rem] grid-cols-[repeat(auto-fill,12rem)] items-start justify-start gap-3">
      {items.map((item) => (
        <ApplicationCard
          key={item.id}
          item={item}
          managementOpen={managementOpen}
          obscured={Boolean(selectedId) && selectedId !== item.id}
          onSelect={onSelect}
          selected={selectedId === item.id}
        />
      ))}
    </section>
  );
}

function ApplicationsEmptyState({ emptyState }: { emptyState: ApplicationEmptyState }) {
  return (
    <ProjectEmptyState
      description={emptyState.description}
      icon={<Search />}
      title={emptyState.title}
    />
  );
}
