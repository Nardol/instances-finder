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
  const refs = React.useRef<Array<HTMLLIElement | null>>([]);
  const listId = React.useId();
  const hintId = React.useId();
  const filterId = React.useId();
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
        role="group"
        aria-labelledby={listId}
        aria-describedby={hintId}
        className="roving-list"
        style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.25rem' }}
      >
        {visible.map((it, idx) => {
          const labelId = `lbl-${it.id}`;
          return (
            <li
              key={it.id}
              role="checkbox"
              aria-checked={it.checked}
              aria-labelledby={labelId}
              aria-posinset={idx + 1}
              aria-setsize={visible.length}
              tabIndex={active === idx ? 0 : -1}
              ref={(el) => (refs.current[idx] = el)}
              onFocus={() => setActive(idx)}
              onClick={(e) => {
                e.preventDefault();
                it.onToggle(!it.checked);
                focusIndex(idx);
              }}
              onKeyDown={(e) => {
                switch (e.key) {
                  case 'ArrowDown':
                    e.preventDefault();
                    focusIndex(idx + 1);
                    break;
                  case 'ArrowUp':
                    e.preventDefault();
                    focusIndex(idx - 1);
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
                    it.onToggle(!it.checked);
                    break;
                  default:
                    break;
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
            </li>
          );
        })}
      </ul>
    </div>
  );
};
