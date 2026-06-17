export function nowIso(): string {
  return new Date().toISOString();
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return ms / (1000 * 60 * 60 * 24);
}

/** آیا یک یادآور با توجه به آخرین انجام و بازه تکرار، اکنون سررسید شده است؟ */
export function isNotificationDue(lastDoneOrSentAt: string | undefined, frequencyDays: number, now = new Date()): boolean {
  if (!lastDoneOrSentAt) return true;
  const last = new Date(lastDoneOrSentAt);
  return daysBetween(last, now) >= frequencyDays;
}

export function isSamePeriod(periodStartIso: string, now = new Date()): boolean {
  const start = new Date(periodStartIso);
  return now.getFullYear() === start.getFullYear() && now.getMonth() === start.getMonth();
}

export function startOfCurrentMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}
