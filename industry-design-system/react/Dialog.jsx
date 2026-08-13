import React from 'react';
import { Corners } from './Blueprint.jsx';

export function Dialog({ title, actions, onDismiss, marks = true, children }) {
  return (
    <div className="dialog-backdrop" onClick={onDismiss}>
      <div
        className={`dialog ${marks ? 'blueprint' : ''}`.trim()}
        role="dialog" aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {marks && <Corners />}
        {title && <div className="dialog-title">{title}</div>}
        {children && <div className="dialog-body">{children}</div>}
        {actions && <div className="dialog-actions">{actions}</div>}
      </div>
    </div>
  );
}
