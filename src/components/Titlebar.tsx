import React from 'react';

const isTauri = () => typeof window !== 'undefined' && '__TAURI_IPC__' in window;

export const Titlebar: React.FC = () => {
  const [maximized, setMaximized] = React.useState(false);

  const handleMinimize = async () => {
    if (!isTauri()) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().minimize();
  };

  const handleToggleMaximize = async () => {
    if (!isTauri()) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const win = getCurrentWindow();
    const isMax = await win.isMaximized();
    if (isMax) {
      await win.unmaximize();
      setMaximized(false);
    } else {
      await win.maximize();
      setMaximized(true);
    }
  };

  const handleClose = async () => {
    if (!isTauri()) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  };

  return (
    <div className="titlebar" role="toolbar" aria-label="Barre de titre">
      <div className="drag-region" data-tauri-drag-region>
        <span className="app-name">Instances Finder</span>
      </div>
      {isTauri() ? (
        <div className="window-controls">
          <button
            type="button"
            className="win-btn"
            onClick={handleMinimize}
            aria-label="Réduire la fenêtre"
            title="Réduire"
          >
            _
          </button>
          <button
            type="button"
            className="win-btn"
            onClick={handleToggleMaximize}
            aria-label={maximized ? 'Restaurer la fenêtre' : 'Agrandir la fenêtre'}
            title={maximized ? 'Restaurer' : 'Agrandir'}
          >
            {maximized ? '[ ]' : '[]'}
          </button>
          <button
            type="button"
            className="win-btn close"
            onClick={handleClose}
            aria-label="Fermer l’application"
            title="Fermer"
          >
            X
          </button>
        </div>
      ) : null}
    </div>
  );
};
