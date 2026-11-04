// Helpers that keep every device on the same room state when several players act at once.

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Three-way merge: keep what `next` changed relative to `base`, on top of `latest`
 * (someone else's newer write). Objects merge key by key; arrays and plain values
 * that we changed replace theirs, and anything we left alone keeps their value.
 */
export function mergeJson(base: unknown, next: unknown, latest: unknown): unknown {
  if (sameJson(base, next)) return latest;
  if (!isPlainObject(base) || !isPlainObject(next) || !isPlainObject(latest)) return next;

  const merged: Record<string, unknown> = { ...latest };
  const keys = new Set([...Object.keys(base), ...Object.keys(next)]);
  for (const key of keys) {
    if (!(key in next)) {
      // we removed it: drop it unless someone else has changed it since
      if (sameJson(latest[key], base[key])) delete merged[key];
    } else {
      merged[key] = mergeJson(base[key], next[key], latest[key]);
    }
  }
  return merged;
}

/** A fresh `updated_at` with microseconds, so two writes in the same millisecond still differ */
export function makeRoomStamp(): string {
  const micro = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return new Date().toISOString().replace('Z', `${micro}+00:00`);
}

/** Compare two timestamptz strings however Postgres or Realtime chose to format them */
export function sameRoomStamp(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const key = (s: string) => {
    const fraction = (s.match(/:\d\d\.(\d+)/)?.[1] || '').padEnd(6, '0').slice(0, 6);
    const iso = s
      .replace(' ', 'T')
      .replace(/\.\d+/, '')
      .replace(/([+-]\d\d)$/, '$1:00');
    const seconds = Date.parse(iso) / 1000;
    return `${seconds}.${fraction}`;
  };
  return key(a) === key(b);
}
