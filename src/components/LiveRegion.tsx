import React, { forwardRef, HTMLAttributes } from 'react';

export const LiveRegion = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function LiveRegion(props, ref) {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-relevant="additions text"
        className="sr-only"
        {...props}
      />
    );
  }
);
