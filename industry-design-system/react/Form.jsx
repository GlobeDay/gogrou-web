import React from 'react';

export function Field({ label, htmlFor, children }) {
  return (
    <div className="field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
    </div>
  );
}

export function Input({ as: As = 'input', className = '', ...rest }) {
  return <As className={`input ${className}`.trim()} {...rest} />;
}

export function Radio({ label, className = '', ...rest }) {
  return (
    <label className={`radio ${className}`.trim()}>
      <input type="radio" {...rest} />
      <span className="dot"></span>
      {label}
    </label>
  );
}

/* options: [{ value, label }] — a native radio group, no script needed. */
export function Segmented({ name, options = [], value, onChange, className = '' }) {
  return (
    <div className={`seg ${className}`.trim()} role="radiogroup">
      {options.map(o => (
        <label className="seg-opt" key={o.value}>
          <input
            type="radio" name={name} value={o.value}
            checked={value === o.value}
            onChange={() => onChange && onChange(o.value)}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
