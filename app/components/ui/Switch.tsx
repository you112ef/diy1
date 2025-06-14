import { memo } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { classNames } from '~/utils/classNames';

interface SwitchProps {
  className?: string;
  checked?: boolean;
  onCheckedChange?: (event: boolean) => void;
}

export const Switch = memo(({ className, onCheckedChange, checked }: SwitchProps) => {
  return (
    {/* Switch track sized for better touch interaction (h-8 => 22px, w-14 => 38.5px at 11px root) */}
    <SwitchPrimitive.Root
      className={classNames(
        'relative h-8 w-14 cursor-pointer rounded-full bg-bolt-elements-button-primary-background', // h-6 w-11 to h-8 w-14
        'transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-bolt-elements-item-contentAccent',
        className,
      )}
      checked={checked}
      onCheckedChange={(e) => onCheckedChange?.(e)}
    >
      {/* Switch thumb sized for better touch interaction (h-7 w-7 => 19.25px) */}
      <SwitchPrimitive.Thumb
        className={classNames(
          'block h-7 w-7 rounded-full bg-white', // h-5 w-5 to h-7 w-7
          'shadow-lg shadow-black/20',
          'transition-transform duration-200 ease-in-out',
          'translate-x-1', // translate-x-0.5 (2px) to translate-x-1 (0.25rem = 2.75px)
          'data-[state=checked]:translate-x-[1.5rem]', // Adjusted for new sizes: 3.5rem (track) - 1.75rem (thumb) - 0.25rem (padding) = 1.5rem
          'will-change-transform',
        )}
      />
    </SwitchPrimitive.Root>
  );
});
