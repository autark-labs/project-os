import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { DisabledAction } from '@/components/project-os/DisabledAction';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type DuplicateInstallWarningDialogProps = {
  appName: string;
  onInstallCopy: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  reviewHref: string | null;
};

export function DuplicateInstallWarningDialog({ appName, onInstallCopy, onOpenChange, open, reviewHref }: DuplicateInstallWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-po-border bg-popover text-popover-foreground sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 grid size-10 place-items-center rounded-lg border border-po-warning-border bg-po-warning-soft text-po-warning">
            <TriangleAlert className="size-5" />
          </div>
          <DialogTitle>Install a second copy?</DialogTitle>
          <DialogDescription className="leading-6 text-muted-foreground">
            Project OS already sees {appName} on your system. Installing another copy can cause confusing behavior across your network, especially from phones, TVs, or other devices that discover services automatically. Pin or adopt the existing service when possible. Install a second copy only if you intentionally want two separate instances.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 border-po-border bg-po-surface-soft">
          {reviewHref ? (
            <Button asChild className="bg-po-warning text-sidebar-primary-foreground hover:bg-po-warning/90">
              <Link to={reviewHref}>Review existing service</Link>
            </Button>
          ) : (
            <DisabledAction disabled reason="Project OS cannot open the existing service review yet. Refresh existing apps and try again.">
              <Button className="bg-po-surface-inset text-po-text-secondary" disabled type="button">
                Review existing service
              </Button>
            </DisabledAction>
          )}
          <Button
            className="border-po-border bg-po-surface text-po-text-secondary hover:bg-po-surface-hover hover:text-po-text"
            onClick={() => {
              onOpenChange(false);
              onInstallCopy();
            }}
            type="button"
            variant="outline"
          >
            Install second copy anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
