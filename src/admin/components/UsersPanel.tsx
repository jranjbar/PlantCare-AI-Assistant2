import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../api';
import { Card, Badge, Input, EmptyState, Spinner } from './ui';
import { UserDetailPanel } from './UserDetailPanel';
import { SubscriptionTier } from '../../types';

type UserRow = Awaited<ReturnType<typeof api.listUsers>>[number];

const TIER_LABEL: Record<SubscriptionTier, string> = { free: 'رایگان', pro: 'کشاورز ویژه', business: 'تجاری' };

export function UsersPanel() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    api.listUsers().then(setUsers);
  }, []);

  if (!users) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const filtered = users.filter(
    (u) =>
      !search ||
      u.firstName?.includes(search) ||
      u.username?.includes(search) ||
      u.chatId.includes(search)
  );

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-5">
      <Card className="p-4 h-fit">
        <div className="relative mb-3">
          <Search size={15} className="absolute right-3 top-2.5 text-forest-900/30" />
          <Input value={search} onChange={setSearch} placeholder="جستجوی نام یا شناسه..." className="pr-9" />
        </div>
        {filtered.length === 0 ? (
          <EmptyState text="هنوز کاربری در ربات تلگرام ثبت نشده است." />
        ) : (
          <div className="space-y-1 max-h-[70vh] overflow-y-auto">
            {filtered.map((u) => (
              <button
                key={u.chatId}
                onClick={() => setSelected(u.chatId)}
                className={`w-full flex items-center justify-between gap-2 p-3 rounded-xl text-right transition-colors ${
                  selected === u.chatId ? 'bg-forest-800 text-white' : 'hover:bg-sage-100'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{u.firstName || `کاربر ${u.chatId}`}</p>
                  <p className={`text-xs ${selected === u.chatId ? 'text-white/60' : 'text-forest-900/50'}`}>
                    {u.plantsCount} گیاه
                  </p>
                </div>
                <Badge tone={u.tier === 'free' ? 'neutral' : 'gold'}>{TIER_LABEL[u.tier]}</Badge>
              </button>
            ))}
          </div>
        )}
      </Card>

      {selected ? (
        <UserDetailPanel chatId={selected} onClose={() => setSelected(null)} />
      ) : (
        <Card className="p-10">
          <EmptyState text="یک کاربر را از فهرست انتخاب کنید تا گیاهان، یادآورها، توصیه‌ها و حافظه‌ی هوشمند او را مشاهده کنید." />
        </Card>
      )}
    </div>
  );
}
