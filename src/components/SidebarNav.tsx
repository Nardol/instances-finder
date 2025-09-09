import React from 'react';

type Item = { id: string; label: string; href: string };

const items: Item[] = [
  { id: 'search', label: 'Recherche', href: '#main' },
  { id: 'results', label: 'Résultats', href: '#results-title' },
];

export const SidebarNav: React.FC = () => {
  return (
    <nav className="sidebar" aria-label="Navigation principale">
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <a href={it.href}>{it.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
