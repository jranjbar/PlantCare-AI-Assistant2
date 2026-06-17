import { useEffect, useState } from 'react';
import { Droplets, Trash2, RefreshCw, BrainCircuit, Sparkles, X } from 'lucide-react';
import { api } from '../api';
import { Card, Badge, Button, Select, Spinner, EmptyState } from './ui';
import { PlanDefinition, SubscriptionTier } from '../../types';

type Detail = Awaited<ReturnType<typeof api.getUserDetail>>;
type Tab = 'plants' | 'notifications' | 'recommendations' | 'memory' | 'subscription';

const STAGE_LABEL: Record<string, string> = {
  seedling: 'نهال',
  growing: 'در حال رشد',
  flowering: 'گلدهی',
  fruiting: 'میوه‌دهی',
  dormant: 'خفته',
  harvested: 'برداشت‌شده',
};

export function UserDetailPanel({ chatId, onClose }: { chatId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [tab, setTab] = useState<Tab>('plants');
  const [busy, setBusy] = useState(false);

  function reload() {
    api.getUserDetail(chatId).then(setDetail);
  }

  useEffect(() => {
    reload();
    api.listPlans().then(setPlans);
  }, [chatId]);

  if (!detail) {
    return (
      <Card className="p-10 flex justify-center">
        <Spinner />
      </Card>
    );
  }

  const { profile, subscription, plan, plants, notifications, recommendations, memory } = detail;

  async function changeTier(tier: SubscriptionTier) {
    setBusy(true);
    await api.setUserTier(chatId, tier);
    reload();
    setBusy(false);
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-forest-800/10">
        <div>
          <h2 className="font-bold text-forest-900">{profile.firstName || `کاربر ${chatId}`}</h2>
          <p className="text-xs text-forest-900/50 font-mono-data">{chatId}</p>
        </div>
        <button onClick={onClose} className="text-forest-900/40 hover:text-forest-900">
          <X size={18} />
        </button>
      </div>

      <div className="flex gap-1 px-5 pt-3 border-b border-forest-800/10 overflow-x-auto">
        {([
          ['plants', `گیاهان (${plants.length})`],
          ['notifications', `یادآورها (${notifications.length})`],
          ['recommendations', `توصیه‌ها (${recommendations.length})`],
          ['memory', 'حافظه هوشمند'],
          ['subscription', 'اشتراک'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
              tab === id ? 'border-forest-700 text-forest-900 font-medium' : 'border-transparent text-forest-900/50 hover:text-forest-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'plants' &&
          (plants.length === 0 ? (
            <EmptyState text="این کاربر هنوز گیاهی در CRM ثبت نکرده است." />
          ) : (
            <div className="space-y-3">
              {plants.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-forest-800/10">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} className="w-12 h-12 rounded-lg object-cover" alt={p.nameFarsi} />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-sage-100" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{p.nameFarsi}</p>
                    <p className="text-xs text-forest-900/50">{STAGE_LABEL[p.stage] || p.stage} · {p.location}</p>
                  </div>
                  <Badge tone={p.healthStatus.issuesFound ? 'danger' : 'success'}>سلامت {p.healthStatus.healthScore}</Badge>
                  <button onClick={() => api.waterPlant(p.id).then(reload)} title="ثبت آبیاری" className="text-forest-800/50 hover:text-forest-800">
                    <Droplets size={16} />
                  </button>
                  <button onClick={() => api.deletePlant(p.id).then(reload)} title="حذف" className="text-terracotta-500/60 hover:text-terracotta-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ))}

        {tab === 'notifications' &&
          (notifications.length === 0 ? (
            <EmptyState text="یادآوری برای این کاربر ثبت نشده است." />
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className="flex items-center justify-between p-3 rounded-xl border border-forest-800/10 text-sm">
                  <div>
                    <p className="font-medium">{n.plantName} — {n.type}</p>
                    <p className="text-xs text-forest-900/50">هر {n.frequencyDays} روز ساعت {n.timeString}</p>
                  </div>
                  <button onClick={() => api.deleteNotification(n.id).then(reload)} className="text-terracotta-500/60 hover:text-terracotta-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ))}

        {tab === 'recommendations' && (
          <div className="space-y-3">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await api.regenerateRecommendations(chatId);
                reload();
                setBusy(false);
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> بازتولید توصیه‌ها
            </Button>
            {recommendations.length === 0 ? (
              <EmptyState text="توصیه‌ای موجود نیست." />
            ) : (
              recommendations.map((r) => (
                <div key={r.id} className="p-3 rounded-xl border border-forest-800/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-amber-600" />
                    <p className="font-medium text-sm">{r.title}</p>
                  </div>
                  <p className="text-sm text-forest-900/70">{r.body}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'memory' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-forest-900/60 text-sm">
              <BrainCircuit size={16} />
              حافظه‌ی اختصاصی این کاربر (AI Memory)
            </div>
            <div className="p-3 rounded-xl bg-sage-100 text-sm leading-7">
              {memory.summary || 'هنوز خلاصه‌ای ساخته نشده است.'}
            </div>
            {memory.facts.length > 0 && (
              <div className="space-y-1">
                {memory.facts.map((f) => (
                  <div key={f.key} className="flex justify-between text-sm px-1">
                    <span className="text-forest-900/50">{f.key}</span>
                    <span className="font-medium">{f.value}</span>
                  </div>
                ))}
              </div>
            )}
            <Button variant="danger" onClick={() => api.clearMemory(chatId).then(reload)}>
              پاک کردن حافظه این کاربر
            </Button>
          </div>
        )}

        {tab === 'subscription' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-sage-100 text-center">
                <p className="text-forest-900/50">دکتر گیاه</p>
                <p className="font-bold font-mono-data">{subscription.scansCount}/{plan.scansLimit}</p>
              </div>
              <div className="p-3 rounded-xl bg-sage-100 text-center">
                <p className="text-forest-900/50">طرح کشت</p>
                <p className="font-bold font-mono-data">{subscription.plansCount}/{plan.plansLimit}</p>
              </div>
              <div className="p-3 rounded-xl bg-sage-100 text-center">
                <p className="text-forest-900/50">چت مشاوره</p>
                <p className="font-bold font-mono-data">{subscription.chatsCount}/{plan.chatsLimit}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={subscription.tier}
                onChange={(v) => changeTier(v as SubscriptionTier)}
                options={plans.map((p) => ({ value: p.tier, label: p.titleFa }))}
                className="w-auto"
              />
              <Button variant="secondary" onClick={() => api.resetUsage(chatId).then(reload)}>
                بازنشانی مصرف ماهانه
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
