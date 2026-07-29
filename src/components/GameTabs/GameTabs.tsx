import { useRef } from 'react';

/** The five selectable analytics views, one per minigame. */
export type AnalyticsTab =
  | 'Zip'
  | 'Tango'
  | 'Queens'
  | 'Mini Sudoku'
  | 'Patches';

export interface GameTabsProps<T extends string> {
  /** Ordered list of tabs to render. */
  tabs: T[];
  /** Currently active tab. */
  active: T;
  /** Called when the user activates a tab. */
  onChange: (tab: T) => void;
  /** Accessible label for the tablist container. */
  ariaLabel?: string;
}

/**
 * Accessible, reusable tab bar (Req 4.2, 4.5, 4.8).
 *
 * Generic over the tab value type `T` so it can drive any single-select
 * segmented control (e.g. the analytics game tabs and the time-range tabs).
 * Pure presentation/interaction component — it holds no data logic.
 *
 * Activation pattern: this component uses **automatic activation**. Moving the
 * focus with the arrow keys both moves DOM focus AND activates the destination
 * tab (calls `onChange`). This is the WAI-ARIA recommended pattern when the
 * associated view can be revealed instantly with no expensive work, which is
 * the case here (metrics are derived synchronously). Enter / Space also
 * activate the focused tab for completeness.
 *
 * Keyboard model:
 * - Roving tabIndex: the active tab is the only tab in the tab order
 *   (`tabIndex=0`); the rest are `tabIndex=-1`.
 * - ArrowLeft / ArrowRight move focus between tabs with wrap-around and
 *   activate the destination tab.
 * - Enter / Space activate the focused tab.
 */
export default function GameTabs<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel = 'Tabs',
}: GameTabsProps<T>) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (index: number) => {
    const count = tabs.length;
    if (count === 0) return;
    // Wrap-around within bounds.
    const wrapped = ((index % count) + count) % count;
    const tab = tabs[wrapped];
    buttonsRef.current[wrapped]?.focus();
    // Automatic activation: moving focus also selects the tab.
    onChange(tab);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        focusTab(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        focusTab(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        focusTab(tabs.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onChange(tabs[index]);
        break;
      default:
        break;
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex items-center gap-1 overflow-x-auto whitespace-nowrap rounded-2xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm p-1 border border-slate-200/60 dark:border-slate-700/50 shadow-sm transition-colors duration-300 hide-scrollbar"
    >
      {tabs.map((tab, index) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            ref={(el) => {
              buttonsRef.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={[
              'relative shrink-0 rounded-xl px-3.5 py-1.5 text-sm font-semibold',
              'transition-all duration-300 outline-none active:scale-95',
              'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              'focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-900',
              isActive
                ? // Active: glassy fill + glow + bottom underline + stronger text colour.
                  'bg-white dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/15 after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-blue-500 dark:after:bg-blue-400'
                : // Inactive: muted, with hover affordance.
                  'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/50',
            ].join(' ')}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
