import { useEffect, useState } from 'react';
import { Users, Sprout, Bell, AlarmClockCheck } from 'lucide-react';
import { api } from '../api';
import { Card, StatCard, Badge, Spinner } from './ui';
import { SubscriptionTier } from '../../types';

const TIER_LABEL: Record<SubscriptionTier, string> = { free: 'رایگان', pro: 'کشاورز ویژه', business: 'تجاری' };

export function OverviewPanel() {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.overview>> | null>(null);

  useEffect(() => {
    api.overview().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-forest-900">نمای کلی</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="کل کاربران ربات" value={data.totalUsers} icon={<Users size={28} />} />
        <StatCard label="گیاهان ثبت‌شده در CRM" value={data.totalPlants} icon={<Sprout size={28} />} />
        <StatCard label="یادآورهای فعال" value={data.activeNotifications} icon={<Bell size={28} />} />
        <StatCard
          label="یادآور سررسیدشده اکنون"
          value={data.dueNotificationsNow}
          icon={<AlarmClockCheck size={28} />}
          tone={data.dueNotificationsNow > 0 ? 'warning' : 'neutral'}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-bold text-forest-900 mb-4">توزیع پلن اشتراک</h2>
          <div className="space-y-3">
            {Object.entries(data.tierCounts).map(([tier, count]) => (
              <div key={tier} className="flex items-center justify-between text-sm">
                <span className="text-forest-900/70">{TIER_LABEL[tier as SubscriptionTier]}</span>
                <span className="font-mono-data font-bold">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-forest-900 mb-4">آخرین کاربران فعال</h2>
          <div className="space-y-2">
            {data.recentUsers.length === 0 && <p className="text-sm text-forest-900/50">هنوز کاربری ثبت نشده است.</p>}
            {data.recentUsers.map((u) => (
              <div key={u.chatId} className="flex items-center justify-between text-sm py-1.5">
                <span>{u.firstName || `کاربر ${u.chatId}`}</span>
                <Badge tone={u.tier === 'free' ? 'neutral' : 'gold'}>{TIER_LABEL[u.tier]}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
