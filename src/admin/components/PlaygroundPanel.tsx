import { useState, ChangeEvent } from 'react';
import { Image as ImageIcon, Send } from 'lucide-react';
import { api, ApiClientError } from '../api';
import { Card, Button, Input, Spinner } from './ui';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PlaygroundPanel() {
  const [tab, setTab] = useState<'doctor' | 'cropplan' | 'chat'>('doctor');

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-forest-900">آزمایشگاه هوش مصنوعی</h1>
      <p className="text-sm text-forest-900/50 -mt-4">
        این بخش فقط برای تست قابلیت‌های هوش مصنوعی توسط ادمین است و در مصرف اشتراک کاربران اثری ندارد.
      </p>
      <div className="flex gap-2">
        {[
          ['doctor', 'دکتر گیاه'],
          ['cropplan', 'طرح کشت'],
          ['chat', 'چت مشاور'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`px-4 py-2 rounded-xl text-sm ${tab === id ? 'bg-forest-800 text-white' : 'bg-white border border-forest-800/10 text-forest-900/70'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'doctor' && <DoctorTester />}
      {tab === 'cropplan' && <CropPlanTester />}
      {tab === 'chat' && <ChatTester />}
    </div>
  );
}

function DoctorTester() {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    setResult(null);
    setError('');
    setLoading(true);
    try {
      const res = await api.testIdentify(dataUrl, 'both');
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'خطای ناشناخته رخ داد.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5 grid md:grid-cols-2 gap-5">
      <label className="border-2 border-dashed border-forest-800/20 rounded-xl flex flex-col items-center justify-center gap-2 p-8 cursor-pointer hover:border-forest-700/40 transition-colors">
        {preview ? <img src={preview} className="max-h-48 rounded-lg" alt="preview" /> : <ImageIcon size={32} className="text-forest-800/30" />}
        <span className="text-sm text-forest-900/60">{preview ? 'تغییر عکس/ویدئو' : 'یک عکس یا ویدئوی گیاه انتخاب کنید'}</span>
        <input type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
      </label>
      <div>
        {loading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}
        {error && <p className="text-sm text-terracotta-500">{error}</p>}
        {result && (
          <div className="space-y-2 text-sm">
            <p className="font-bold text-forest-900">{result.nameFarsi} ({result.nameEnglish})</p>
            <p className="text-forest-900/60">{result.description}</p>
            <p>سلامت: {result.healthStatus?.healthScore}/100</p>
            <p className="text-forest-900/70">{result.healthStatus?.diagnoses}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function CropPlanTester() {
  const [plantName, setPlantName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    setLoading(true);
    setError('');
    try {
      setResult(await api.testCropPlan(plantName));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'خطای ناشناخته رخ داد.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex gap-2">
        <Input value={plantName} onChange={setPlantName} placeholder="نام گیاه (مثلاً گوجه‌فرنگی)" />
        <Button onClick={run} disabled={loading || !plantName}>
          {loading ? '...' : 'تولید طرح'}
        </Button>
      </div>
      {error && <p className="text-sm text-terracotta-500">{error}</p>}
      {result && (
        <div className="space-y-3 text-sm">
          <p className="font-bold text-forest-900">{result.cropTitle}</p>
          <p className="text-forest-900/60">{result.generalAdvice}</p>
          {result.stages?.map((s: any) => (
            <div key={s.stageId} className="p-3 rounded-xl bg-sage-100">
              <p className="font-medium">{s.title} ({s.durationWeeks} هفته)</p>
              <ul className="list-disc pr-5 mt-1 text-forest-900/70">
                {s.tasks?.map((t: string, i: number) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ChatTester() {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await api.testChat(message);
      setReply(res.text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex gap-2">
        <Input value={message} onChange={setMessage} placeholder="پیام تست برای مشاور هوش مصنوعی..." />
        <Button onClick={run} disabled={loading || !message} className="flex items-center gap-1">
          <Send size={14} /> ارسال
        </Button>
      </div>
      {reply && <p className="text-sm leading-7 text-forest-900/80 bg-sage-100 p-4 rounded-xl">{reply}</p>}
    </Card>
  );
}
