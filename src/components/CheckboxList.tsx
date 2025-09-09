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
  brailleRefresh?: boolean;
};

export const CheckboxList: React.FC<Props> = ({ label, items, filterPlaceholder, announcementLabels, brailleRefresh = false }) => {
  const [active, setActive] = React.useState(0);
  const listboxRef = React.useRef<HTMLUListElement | null>(null);
  const listId = React.useId();
  const hintId = React.useId();
  const filterId = React.useId();
  const [query, setQuery] = React.useState('');
  const labels = announcementLabels || { selected: 'selected', notSelected: 'not selected' };
  // Activedescendant proxy (optional) to nudge braille refresh when enabled in prefs
  const [adRefresh, setAdRefresh] = React.useState(false);
  const proxyId = React.useId();

  const focusIndex = (idx: number) => {
    const max = Math.max(0, visible.length - 1);
    const clamped = Math.max(0, Math.min(max, idx));
    setActive(clamped);
    // Keep focus on the listbox to maintain Orca focus mode
    listboxRef.current?.focus();
  };

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.label.toLowerCase().includes(q));
  }, [items, query]);

  React.useEffect(() => {
    if (active > visible.length - 1) setActive(0);
  }, [visible.length, active]);

  // No live announcements here; rely on listbox/option semantics.

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
      <ul
        ref={listboxRef}
        role="listbox"
        aria-multiselectable="true"
        aria-labelledby={listId}
        aria-describedby={hintId}
        aria-activedescendant={
          (brailleRefresh && adRefresh)
            ? proxyId
            : (visible[active] ? `opt-${visible[active].id}` : undefined)
        }
        tabIndex={0}
        className="roving-list"
        style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.25rem' }}
        onKeyDown={(e) => {
          if (visible.length === 0) return;
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
            case 'Enter': {
              e.preventDefault();
              const it = visible[active];
              if (it) {
                it.onToggle(!it.checked);
                if (brailleRefresh) {
                  setAdRefresh(true);
                  requestAnimationFrame(() => setAdRefresh(false));
                }
              }
              break; }
            default:
              break;
          }
        }}
      >
        
        {visible.map((it, idx) => {
          const labelId = `lbl-${it.id}`;
          const stateId = `st-${it.id}`;
          return (
            <li
              key={it.id}
              id={`opt-${it.id}`}
              role="option"
              aria-selected={it.checked}
              aria-checked={it.checked}
              aria-labelledby={`${labelId} ${stateId}`}
              aria-posinset={idx + 1}
              aria-setsize={visible.length}
              onMouseEnter={() => setActive(idx)}
              onClick={(e) => {
                e.preventDefault();
                setActive(idx);
                it.onToggle(!it.checked);
                listboxRef.current?.focus();
                if (brailleRefresh) {
                  setAdRefresh(true);
                  requestAnimationFrame(() => setAdRefresh(false));
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 6,
                outlineOffset: 2,
                cursor: 'pointer',
              }}
            >
              <span aria-hidden="true" className="check-icon" style={{ width: 18, textAlign: 'center' }}>
                {it.checked ? '☑' : '☐'}
              </span>
              <span id={labelId}>{it.label}</span>
              <span id={stateId} className="sr-only">
                {it.checked ? labels.selected : labels.notSelected}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
