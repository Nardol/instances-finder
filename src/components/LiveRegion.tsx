import React, { forwardRef, HTMLAttributes } from 'react';

export const LiveRegion = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function LiveRegion(props, ref) {
    return <div ref={ref} aria-live="polite" aria-atomic="true" className="sr-only" {...props} />;
  }
);
