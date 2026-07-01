import type { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';
import { Surface } from '@/components/primitives/Surface';

export function PageHeader({
  children,
  description,
  title,
}: {
  children?: ReactNode;
  description?: ReactNode;
  title: ReactNode;
}) {
  return (
    <Surface as="header" tone="panel">
      <div className="flex flex-col gap-2 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
            {description && <p className="max-w-2xl text-sm leading-6 text-sky-100/80">{description}</p>}
          </div>
        </div>
      </div>

      {children && (
        <>
          <Separator className="bg-sky-400/20" />
          {children}
        </>
      )}
    </Surface>
  );
}

