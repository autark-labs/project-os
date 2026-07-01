import type { ComponentProps } from 'react';
import {
  ProjectDarkControlButton,
  ProjectLightControlButton,
  ProjectOpenButton,
  ProjectPrimaryButton,
  ProjectWarningButton,
} from '@/components/primitives/ProjectButtons';

type ButtonProps = ComponentProps<typeof ProjectPrimaryButton>;

export function ApplicationPrimaryButton({ className, ...props }: ButtonProps) {
  return <ProjectPrimaryButton className={className} {...props} />;
}

export function ApplicationOpenButton({ className, ...props }: ButtonProps) {
  return <ProjectOpenButton className={className} {...props} />;
}

export function ApplicationLightControlButton({ className, ...props }: ButtonProps) {
  return <ProjectLightControlButton className={className} {...props} />;
}

export function ApplicationDarkControlButton({ className, ...props }: ButtonProps) {
  return <ProjectDarkControlButton className={className} {...props} />;
}

export function ApplicationWarningButton({ className, ...props }: ButtonProps) {
  return <ProjectWarningButton className={className} {...props} />;
}
