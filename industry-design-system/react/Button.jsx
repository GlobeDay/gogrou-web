import React from 'react';
import { Corners } from './Blueprint.jsx';

/* variant: 'primary' | 'secondary' | 'ghost'
   The primary button is the one solid object on the board — it keeps the
   square corners and wears the registration marks. */
export function Button({
  variant = 'secondary', icon = false, block = false,
  marks = variant === 'primary', className = '', children, ...rest
}) {
  const cls = [
    'btn', `btn-${variant}`,
    icon && 'btn-icon', block && 'btn-block',
    marks && 'blueprint', className
  ].filter(Boolean).join(' ');
  return (
    <button className={cls} {...rest}>
      {marks && <Corners />}
      {children}
    </button>
  );
}

/* variant: 'accent' | 'accent-2' | 'neutral' | 'outline' */
export function Tag({ variant = 'neutral', className = '', children, ...rest }) {
  return <span className={`tag tag-${variant} ${className}`.trim()} {...rest}>{children}</span>;
}
