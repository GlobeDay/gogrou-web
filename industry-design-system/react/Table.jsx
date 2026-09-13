import React from 'react';

/* columns: [{ key, label }] — rows are plain objects. */
export function Table({ columns = [], rows = [], className = '' }) {
  return (
    <table className={`table ${className}`.trim()}>
      <thead>
        <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id ?? i}>{columns.map(c => <td key={c.key}>{r[c.key]}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
