import { useState } from 'react';
import { Leaf } from 'lucide-react';
import { api, ApiClientError } from '../api';
import { Button, Input, Card } from './ui';

export function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    setLoading(true);
    try {
      await api.login(username, password);
      onLoggedIn();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'خطا در ورود به سیستم.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-950 p-6">
      <Card className="w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-forest-800 flex items-center justify-center mb-3">
            <Leaf className="text-white" size={24} />
          </div>
          <h1 className="text-lg font-bold text-forest-900">داشبورد ادمین رویش‌بان</h1>
          <p className="text-sm text-forest-900/50 mt-1">برای مدیریت ربات وارد شوید</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-3"
        >
          <Input value={username} onChange={setUsername} placeholder="نام کاربری" />
          <Input value={password} onChange={setPassword} placeholder="رمز عبور" type="password" />
          {error && <p className="text-sm text-terracotta-500">{error}</p>}
          <Button type="submit" className="w-full justify-center" disabled={loading}>
            {loading ? 'در حال ورود...' : 'ورود'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
