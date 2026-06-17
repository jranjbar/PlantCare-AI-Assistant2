import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../api';
import { Card, Button, Input, Spinner } from './ui';

export function SettingsPanel() {
  const [tgToken, setTgToken] = useState('');
  const [tgTokenMasked, setTgTokenMasked] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getTelegramConfig().then((c) => {
      setTgTokenMasked(c.tgTokenMasked);
      setWebhookUrl(c.webhookUrl);
      setWelcomeMsg(c.customWelcomeMsg);
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaved(false);
    await api.saveTelegramConfig({
      ...(tgToken ? { tgToken } : {}),
      webhookUrl,
      customWelcomeMsg: welcomeMsg,
    });
    setTgToken('');
    setSaved(true);
    api.getTelegramConfig().then((c) => setTgTokenMasked(c.tgTokenMasked));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-bold text-forest-900">تنظیمات ربات تلگرام</h1>
      <Card className="p-5 space-y-4">
        <div>
          <label className="text-sm text-forest-900/60 mb-1 block">توکن ربات (فعلی: {tgTokenMasked || 'تنظیم نشده'})</label>
          <Input value={tgToken} onChange={setTgToken} placeholder="برای تغییر، توکن جدید را وارد کنید" />
        </div>
        <div>
          <label className="text-sm text-forest-900/60 mb-1 block">آدرس Webhook</label>
          <Input value={webhookUrl} onChange={setWebhookUrl} placeholder="https://your-domain.com/api/telegram" />
        </div>
        <div>
          <label className="text-sm text-forest-900/60 mb-1 block">پیام خوش‌آمدگویی</label>
          <textarea
            value={welcomeMsg}
            onChange={(e) => setWelcomeMsg(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-forest-800/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
          />
        </div>
        <Button onClick={save} className="flex items-center gap-2">
          <Save size={14} /> ذخیره تنظیمات
        </Button>
        {saved && <p className="text-sm text-forest-600">ذخیره شد ✅</p>}
      </Card>
    </div>
  );
}
