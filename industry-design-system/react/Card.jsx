import React from 'react';
import { Corners } from './Blueprint.jsx';

/* Transparent, hairline-bordered line drawing. elevation: null | 'sm' | 'md' | 'lg'
   (elevation is available but the system prefers flat framed objects). */
export function Card({ kicker, title, meta, elevation, marks = true, className = '', children, ...rest }) {
  const cls = ['card', marks && 'blueprint', elevation && `elev-${elevation}`, className]
    .filter(Boolean).join(' ');
  return (
    <div className={cls} {...rest}>
      {marks && <Corners />}
      {kicker && <div className="card-kicker">{kicker}</div>}
      {title && <div className="card-title">{title}</div>}
      {children && <div className="card-body">{children}</div>}
      {meta && <div className="card-meta">{meta}</div>}
    </div>
  );
}
