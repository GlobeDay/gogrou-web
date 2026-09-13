import React from 'react';

/* links: [{ href, label, current }] */
export function Nav({ brand, links = [], children, className = '' }) {
  return (
    <nav className={`nav ${className}`.trim()}>
      {brand && <div className="nav-brand">{brand}</div>}
      {links.map(l => (
        <a key={l.href} href={l.href} aria-current={l.current ? 'page' : undefined}>{l.label}</a>
      ))}
      {children}
    </nav>
  );
}
