import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
} from 'lucide-react';

import { cn } from '../../lib/cn';

export type ShellTab = 'learn' | 'dictionary' | 'stats';

interface MobileShellProps {
  activeTab: ShellTab;
  children: ReactNode;
  onRefresh?: () => Promise<void> | void;
  onTabChange: (tab: ShellTab) => void;
  showNavigation?: boolean;
}

const tabs: Array<{ id: ShellTab; label: string; icon: typeof CalendarDays }> = [
  { id: 'learn', label: 'Сегодня', icon: CalendarDays },
  { id: 'dictionary', label: 'Словарь', icon: BookOpen },
  { id: 'stats', label: 'Статистика', icon: BarChart3 },
];

export function MobileShell({
  activeTab,
  children,
  onRefresh,
  onTabChange,
  showNavigation = true,
}: MobileShellProps) {
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const clearTouch = () => {
      touchStartY.current = null;
    };
    window.addEventListener('touchcancel', clearTouch);
    return () => window.removeEventListener('touchcancel', clearTouch);
  }, []);

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (event.currentTarget.scrollTop === 0) touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = async (event: TouchEvent<HTMLElement>) => {
    if (touchStartY.current === null || !onRefresh) return;
    const distance = event.changedTouches[0]?.clientY - touchStartY.current;
    touchStartY.current = null;
    if (distance < 72 || refreshing) return;

    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div className="min-h-[100svh] bg-ink text-slate-100 selection:bg-accent/25">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-lg flex-col overflow-hidden border-x border-line/60 bg-ink">
        <main
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pt-[max(env(safe-area-inset-top),1rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            showNavigation ? 'pb-28' : 'pb-[max(env(safe-area-inset-bottom),1.5rem)]',
          )}
          onTouchEnd={handleTouchEnd}
          onTouchStart={handleTouchStart}
        >
          {refreshing && <div className="pb-3 text-center text-xs font-medium text-sky-300">Обновляем данные...</div>}
          {children}
        </main>

        {showNavigation && (
          <nav
            aria-label="Основная навигация"
            className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-lg justify-around border-t border-line/70 bg-surface/90 px-2 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2 backdrop-blur-xl"
          >
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={label}
                  onClick={() => onTabChange(id)}
                  className={cn(
                    'flex min-h-touch min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-touch px-1 text-[11px] font-semibold transition-colors',
                    isActive ? 'bg-accent/10 text-accent' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100',
                  )}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.6 : 2} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
