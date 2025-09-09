import React from 'react';

export type CheckboxItem = {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (next: boolean) => void;
};

type Props = {
  label: string;
  items: CheckboxItem[];
  filterPlaceholder?: string;
  announcementLabels?: { selected: string; notSelected: string };
};

export const CheckboxList: React.FC<Props> = ({ label, items, filterPlaceholder, announcementLabels }) => {
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const listId = React.useId();
  const hintId = React.useId();
  const filterId = React.useId();
  const statusId = React.useId();
  const [query, setQuery] = React.useState('');
  const announceRef = React.useRef<HTMLParagraphElement | null>(null);
  const labels = announcementLabels || { selected: 'selected', notSelected: 'not selected' };

  const focusIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setActive(clamped);
    refs.current[clamped]?.focus();
  };

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.label.toLowerCase().includes(q));
  }, [items, query]);

  React.useEffect(() => {
    if (active > visible.length - 1) setActive(0);
  }, [visible.length, active]);

  const activeAnnouncement = React.useMemo(() => {
    const it = visible[active];
    if (!it) return '';
    return `${it.label} — ${it.checked ? labels.selected : labels.notSelected}`;
  }, [visible, active, labels.selected, labels.notSelected]);

  // Force screen reader announcement even when focus stays on the listbox
  React.useEffect(() => {
    const el = announceRef.current;
    if (!el) return;
    el.textContent = '';
    // Delay to ensure DOM mutation is detected
    const id = window.setTimeout(() => {
      el.textContent = activeAnnouncement;
    }, 0);
    return () => window.clearTimeout(id);
  }, [activeAnnouncement]);

  return (
    <div>
      <div id={listId} className="label" style={{ marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ marginBottom: 6 }}>
        <label htmlFor={filterId} className="sr-only">{filterPlaceholder || 'Filtrer'}</label>
        <input
          id={filterId}
          type="text"
          placeholder={filterPlaceholder || 'Filtrer'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%', maxWidth: 260 }}
        />
      </div>
      <p id={hintId} className="sr-only">
        Utilisez Haut/Bas pour naviguer, Espace pour cocher/décocher. Tab pour quitter la liste.
      </p>
      {/* Live status for SR (outside the listbox focus to avoid mode switches) */}
      <p ref={announceRef} className="sr-only" role="status" aria-live="polite">
        {activeAnnouncement}
      </p>
      <ul
        ref={listRef}
        role="listbox"
        aria-multiselectable="true"
        aria-activedescendant={visible[active] ? visible[active].id : undefined}
        aria-labelledby={listId}
        aria-describedby={hintId}
        tabIndex={0}
        className="roving-list"
        style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.25rem' }}
        onKeyDown={(e) => {
          switch (e.key) {
            case 'ArrowDown':
              e.preventDefault();
              focusIndex(active + 1);
              break;
            case 'ArrowUp':
              e.preventDefault();
              focusIndex(active - 1);
              break;
            case 'Home':
              e.preventDefault();
              focusIndex(0);
              break;
            case 'End':
              e.preventDefault();
              focusIndex(visible.length - 1);
              break;
            case ' ': // Space
            case 'Enter':
              e.preventDefault();
              const it = visible[active];
              if (it) it.onToggle(!it.checked);
              break;
            default:
              break;
          }
        }}
      >
        {visible.map((it, idx) => (
          <li
            key={it.id}
            id={it.id}
            role="option"
            aria-selected={it.checked}
            aria-posinset={idx + 1}
            aria-setsize={visible.length}
            className={
              'option-item' + (idx === active ? ' is-active' : '') + (it.checked ? ' is-selected' : '')
            }
            onMouseDown={(e) => {
              // Keep focus on listbox
              e.preventDefault();
            }}
            onClick={(e) => {
              e.preventDefault();
              setActive(idx);
              it.onToggle(!it.checked);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.25rem 0.5rem',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            <span aria-hidden="true" className="check-icon" style={{ width: 18, textAlign: 'center' }}>
              {it.checked ? '☑' : '☐'}
            </span>
            <span>{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
