import React from 'react';
import { Titlebar } from './Titlebar';
import { SidebarNav } from './SidebarNav';
import { StatusBar } from './StatusBar';
import { SkipLink } from './SkipLink';

type Props = {
  statusText: string;
  flashText?: string | null;
  children: React.ReactNode;
};

export const AppShell: React.FC<Props> = ({ statusText, flashText, children }) => {
  // Bridge the StatusBar "Actualiser" button to the same refresh flow used by the menu.
  React.useEffect(() => {
    const handler = () => {
      const ev = new Event('menu://refresh');
      window.dispatchEvent(ev);
    };
    const btnHandler = (e: Event) => {
      if ((e as CustomEvent).type === 'app:refresh') handler();
    };
    window.addEventListener('app:refresh', btnHandler as any);
    return () => window.removeEventListener('app:refresh', btnHandler as any);
  }, []);
  return (
    <div className="app-shell">
      <SkipLink />
      <Titlebar />
      <div className="app-body">
        <SidebarNav />
        <div className="app-content">{children}</div>
      </div>
      <StatusBar text={statusText} flash={flashText} />
    </div>
  );
};
