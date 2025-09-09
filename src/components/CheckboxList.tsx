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
};

export const CheckboxList: React.FC<Props> = ({ label, items }) => {
  const [active, setActive] = React.useState(0);
  const refs = React.useRef<Array<HTMLLIElement | null>>([]);
  const listId = React.useId();
  const hintId = React.useId();

  const focusIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setActive(clamped);
    refs.current[clamped]?.focus();
  };

  return (
    <div>
      <div id={listId} className="label" style={{ marginBottom: 4 }}>
        {label}
      </div>
      <p id={hintId} className="sr-only">
        Utilisez Haut/Bas pour naviguer, Espace pour cocher/décocher. Tab pour quitter la liste.
      </p>
      <ul
        role="listbox"
        aria-multiselectable="true"
        aria-labelledby={listId}
        aria-describedby={hintId}
        className="roving-list"
        style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.25rem' }}
      >
        {items.map((it, idx) => (
          <li
            key={it.id}
            role="option"
            aria-selected={it.checked}
            tabIndex={active === idx ? 0 : -1}
            ref={(el) => (refs.current[idx] = el)}
            onFocus={() => setActive(idx)}
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
                  focusIndex(items.length - 1);
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
            }}
          >
            <input
              type="checkbox"
              checked={it.checked}
              onChange={(e) => it.onToggle(e.target.checked)}
              tabIndex={-1}
              aria-hidden="true"
            />
            <span>{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

