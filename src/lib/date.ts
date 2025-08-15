export const TZ = process.env.NEXT_PUBLIC_TIMEZONE || 'Europe/Riga';

/** Возвращает интервал "сейчас ± X минут" */
export function windowAroundNow(minutesBefore = 60, minutesAfter = 90) {
  const now = new Date();
  const from = new Date(now.getTime() - minutesBefore * 60_000);
  const to = new Date(now.getTime() + minutesAfter * 60_000);
  return { from, to };
}

/** Удобный формат для UI */
export function fmt(dt: string | Date) {
  const d = typeof dt === 'string' ? new Date(dt) : dt;
  return d.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}
