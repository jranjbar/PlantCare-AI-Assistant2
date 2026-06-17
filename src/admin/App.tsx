import { useEffect, useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar, Page } from './components/Sidebar';
import { OverviewPanel } from './components/OverviewPanel';
import { UsersPanel } from './components/UsersPanel';
import { PlaygroundPanel } from './components/PlaygroundPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { api } from './api';
import { Spinner } from './components/ui';

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState<Page>('overview');

  useEffect(() => {
    api
      .me()
      .then(() => setLoggedIn(true))
      .catch(() => setLoggedIn(false))
      .finally(() => setAuthChecked(true));
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginScreen onLoggedIn={() => setLoggedIn(true)} />;
  }

  return (
    <div className="flex">
      <Sidebar page={page} setPage={setPage} />
      <main className="flex-1 p-6 lg:p-8 max-w-[1400px]">
        {page === 'overview' && <OverviewPanel />}
        {page === 'users' && <UsersPanel />}
        {page === 'playground' && <PlaygroundPanel />}
        {page === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}
