import { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-forest-800/10 shadow-sm ${className}`}>{children}</div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  const base = 'px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    primary: 'bg-forest-800 text-white hover:bg-forest-700',
    secondary: 'bg-sage-100 text-forest-900 hover:bg-sage-100/70 border border-forest-800/10',
    danger: 'bg-terracotta-500 text-white hover:bg-terracotta-500/90',
    ghost: 'text-forest-800 hover:bg-sage-100',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'gold' }) {
  const tones: Record<string, string> = {
    neutral: 'bg-sage-100 text-forest-900',
    success: 'bg-forest-600/10 text-forest-700',
    warning: 'bg-amber-500/15 text-amber-600',
    danger: 'bg-terracotta-100 text-terracotta-500',
    gold: 'bg-amber-500/20 text-amber-600',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function StatCard({ label, value, icon, tone = 'neutral' }: { label: string; value: ReactNode; icon?: ReactNode; tone?: 'neutral' | 'warning' }) {
  return (
    <Card className="p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-forest-900/60">{label}</p>
        <p className={`text-2xl font-bold mt-1 font-mono-data ${tone === 'warning' ? 'text-amber-600' : 'text-forest-900'}`}>{value}</p>
      </div>
      {icon && <div className="text-forest-800/30">{icon}</div>}
    </Card>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-lg border border-forest-800/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 ${className}`}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 rounded-lg border border-forest-800/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-forest-900/50 text-center py-10">{text}</p>;
}

export function Spinner() {
  return <div className="w-5 h-5 border-2 border-forest-800/20 border-t-forest-800 rounded-full animate-spin" />;
}
