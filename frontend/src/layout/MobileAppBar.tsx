import { Activity, Archive, Compass, Database, House, LayoutGrid, Menu, Settings, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useProjectSettings } from '@/contexts/ProjectSettingsContext';
import { cn } from '@/lib/utils';
import { navigationGroups } from './navigationModel';

type NavItem = {
  label: string;
  to: string;
  icon: string;
  activePaths?: string[];
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const navIcons: Record<string, LucideIcon> = {
  access: Users,
  activity: Activity,
  apps: LayoutGrid,
  backups: Archive,
  diagnostics: Activity,
  discover: Compass,
  home: House,
  settings: Settings,
  storage: Database,
};

function MobileAppBar() {
  const location = useLocation();
  const { viewMode } = useProjectSettings();
  const navGroups = navigationGroups(viewMode) as NavGroup[];

  return (
    <div className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-3 border-b border-slate-700/45 bg-slate-950/88 px-4 text-po-text shadow-po-sidebar backdrop-blur-xl lg:hidden">
      <div className="min-w-0">
        <p className="m-0 truncate text-xs font-semibold uppercase tracking-normal text-sky-300">Project OS</p>
        <h1 className="m-0 truncate text-base font-black leading-none text-white">Appliance</h1>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button aria-label="Open navigation" className="border-slate-700/60 bg-slate-950/50 text-slate-100 hover:bg-slate-900" size="sm" type="button" variant="outline">
            <Menu data-icon="inline-start" />
            Menu
          </Button>
        </SheetTrigger>
        <SheetContent className="border-slate-800 bg-slate-950 p-0 text-slate-100" side="left">
          <SheetHeader className="border-b border-slate-800 p-4">
            <SheetTitle className="text-white">Project OS navigation</SheetTitle>
            <SheetDescription>Move between core appliance flows and advanced tools.</SheetDescription>
          </SheetHeader>
          <nav aria-label="Mobile navigation" className="grid gap-5 p-4">
            {navGroups.map((group, groupIndex) => (
              <section className="grid gap-2" key={group.label || `group-${groupIndex}`}>
                {group.label && <p className="m-0 text-xs font-black uppercase tracking-normal text-slate-500">{group.label}</p>}
                <div className="grid gap-1">
                  {group.items.map((item) => {
                    const Icon = navIcons[item.icon] || House;
                    const activeByAlias = item.activePaths?.includes(location.pathname);
                    return (
                      <SheetClose asChild key={item.label}>
                        <NavLink
                          aria-label={item.label}
                          className={({ isActive }) => cn(
                            'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-200 no-underline transition hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
                            (isActive || activeByAlias) && 'bg-sky-500 text-white shadow-po-info-glow hover:bg-sky-500'
                          )}
                          to={item.to}
                        >
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SheetClose>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default MobileAppBar;
