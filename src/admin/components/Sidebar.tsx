import { LayoutDashboard, Users, Settings, FlaskConical, LogOut, Leaf } from 'lucide-react';
import { ReactNode } from 'react';
import { api } from '../api';

export type Page = 'overview' | 'users' | 'settings' | 'playground';

const NAV: { id: Page; label: string; icon: ReactNode }[] = [
  { id: 'overview', label: 'نمای کلی', icon: <LayoutDashboard size={18} /> },
  { id: 'users', label: 'کاربران و CRM', icon: <Users size={18} /> },
  { id: 'playground', label: 'آزمایشگاه هوش مصنوعی', icon: <FlaskConical size={18} /> },
  { id: 'settings', label: 'تنظیمات ربات', icon: <Settings size={18} /> },
];

export function Sidebar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return (
    <aside className="w-60 shrink-0 bg-forest-950 text-white flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-forest-700 flex items-center justify-center">
          <Leaf size={18} />
        </div>
        <div>
          <p className="font-bold text-sm">رویش‌بان</p>
          <p className="text-xs text-white/40">داشبورد مدیریت</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              page === item.id ? 'bg-forest-700 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => api.logout().then(() => window.location.reload())}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          خروج
        </button>
      </div>
    </aside>
  );
}
