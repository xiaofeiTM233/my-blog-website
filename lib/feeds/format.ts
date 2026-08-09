import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatFeedTime(unixSeconds: number): string {
  const target = dayjs.unix(unixSeconds);
  const now = dayjs();
  if (!target.isValid()) return '-';
  if (now.diff(target, 'hour') < 24) return target.fromNow();
  if (now.diff(target, 'year') < 1) return target.format('MM-DD HH:mm');
  return target.format('YYYY-MM-DD');
}

export function formatDateTime(value?: string | number): string {
  if (value === undefined || value === null || value === '') return '-';
  const d = typeof value === 'number' ? dayjs.unix(value) : dayjs(value);
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : '-';
}

export function clampText(text: string, max: number): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false };
  return { text: `${text.slice(0, max)}…`, truncated: true };
}
