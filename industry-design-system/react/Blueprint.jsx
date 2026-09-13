import React from 'react';

/* The wireframe frame every card, figure and primary button wears:
   square corners, a hairline border and four "+" registration marks. */
export function Corners() {
  return (
    <>
      <i className="corner tl"></i>
      <i className="corner tr"></i>
      <i className="corner bl"></i>
      <i className="corner br"></i>
    </>
  );
}

export function Blueprint({ as: As = 'div', className = '', children, ...rest }) {
  return (
    <As className={`blueprint ${className}`.trim()} {...rest}>
      <Corners />
      {children}
    </As>
  );
}

/* Photographs are desaturated and washed in the accent. Wrap the <img>. */
export function Duotone({ framed = true, className = '', children, ...rest }) {
  return (
    <div className={`duotone ${framed ? 'blueprint' : ''} ${className}`.trim()} {...rest}>
      {framed && <Corners />}
      {children}
    </div>
  );
}
