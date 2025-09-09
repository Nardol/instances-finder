import React, { forwardRef } from 'react';

export const LiveRegion = forwardRef<HTMLDivElement, {}>(function LiveRegion(_props, ref) {
  return (
    <div ref={ref} aria-live="polite" aria-atomic="true" className="sr-only" />
  );
});

