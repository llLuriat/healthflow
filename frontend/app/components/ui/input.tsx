import React from 'react';
import { cn } from './utils';

/**
 * Input — componente de campo de texto compatível com react-hook-form (React 18)
 *
 * Usa React.forwardRef para garantir que o ref do react-hook-form register()
 * chegue ao elemento DOM nativo. Sem isso, o react-hook-form não consegue
 * rastrear o valor do campo e a validação falha mesmo com conteúdo digitado.
 */
const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-input-background px-3 py-1 text-base transition-[color,box-shadow] outline-none',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        'selection:bg-[var(--hf-primary)] selection:text-white',
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
