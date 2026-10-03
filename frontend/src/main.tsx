import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { api } from './api/client';
import { MobileShell, type ShellTab } from './components/layout';
import { StudySession } from './components/study/StudySession';
import { DictionaryPage } from './pages/DictionaryPage';
import { LearnPage } from './pages/LearnPage';
import { StatsPage } from './pages/StatsPage';
import './styles.css';

const tabPaths: Record<ShellTab, string> = {
  learn: '/',
  dictionary: '/dictionary',
  stats: '/stats',
};

function normalizePathname(pathname: string): string {
  if (pathname === '/games' || pathname === '/test-session') return '/';
  return ['/', '/study', '/dictionary', '/stats'].includes(pathname) ? pathname : '/';
}

function initialPathname(): string {
  const pathname = normalizePathname(window.location.pathname);
  if (pathname !== window.location.pathname) window.history.replaceState(null, '', pathname);
  return pathname;
}

function tabFromPath(pathname: string): ShellTab {
  if (pathname === '/dictionary') return 'dictionary';
  if (pathname === '/stats') return 'stats';
  return 'learn';
}

function App() {
  const [pathname, setPathname] = useState(initialPathname);
  const activeTab = tabFromPath(pathname);
  const isStudyRoute = pathname === '/study';

  useEffect(() => {
    const sync = () => {
      void api.syncPendingChanges();
    };
    window.addEventListener('online', sync);
    void api.syncPendingChanges();
    return () => {
      window.removeEventListener('online', sync);
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const nextPathname = normalizePathname(window.location.pathname);
      if (nextPathname !== window.location.pathname) window.history.replaceState(null, '', nextPathname);
      setPathname(nextPathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToPath = (path: string) => {
    const nextPathname = normalizePathname(path);
    if (nextPathname === pathname) return;
    window.history.pushState(null, '', nextPathname);
    setPathname(nextPathname);
  };

  const navigateToTab = (tab: ShellTab) => {
    navigateToPath(tabPaths[tab]);
  };

  const refresh = async () => {
    await api.syncPendingChanges();
  };

  return (
    <MobileShell
      activeTab={activeTab}
      showNavigation={!isStudyRoute}
      onRefresh={refresh}
      onTabChange={navigateToTab}
    >
      {isStudyRoute ? <StudySession onExit={() => navigateToPath('/')} /> : (
        <>
          {activeTab === 'learn' && <LearnPage onStartSession={() => navigateToPath('/study')} />}
          {activeTab === 'dictionary' && <DictionaryPage />}
          {activeTab === 'stats' && <StatsPage />}
        </>
      )}
    </MobileShell>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
