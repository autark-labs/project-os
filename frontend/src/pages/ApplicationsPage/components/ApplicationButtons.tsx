import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ButtonProps = ComponentProps<typeof Button>;

export function ApplicationPrimaryButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn('bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-200', className)}
      {...props}
    />
  );
}

export function ApplicationOpenButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn('bg-cyan-300 text-slate-950 shadow-sm shadow-cyan-700/20 hover:bg-cyan-200', className)}
      {...props}
    />
  );
}

export function ApplicationLightControlButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn('border-sky-300 bg-white text-slate-950 hover:bg-sky-100', className)}
      variant="outline"
      {...props}
    />
  );
}

export function ApplicationDarkControlButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn('border-sky-400/40 bg-slate-900 text-sky-50 hover:bg-slate-700 hover:text-white', className)}
      variant="outline"
      {...props}
    />
  );
}

export function ApplicationWarningButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn('bg-orange-500 text-white shadow-md shadow-orange-700/20 hover:bg-orange-400', className)}
      {...props}
    />
  );
}
