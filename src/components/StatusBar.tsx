import React from 'react';

type Props = { text: string; flash?: string | null };

export const StatusBar: React.FC<Props> = ({ text, flash }) => {
  return (
    <footer className="status-bar" role="status" aria-live="polite" aria-atomic="true">
      <span>{text}</span>
      <span style={{ marginLeft: 'auto' }}>
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('app:refresh'))}>
          Actualiser
        </button>
      </span>
      {flash ? <span style={{ marginLeft: '0.75rem', opacity: 0.9 }}>{flash}</span> : null}
    </footer>
  );
};
