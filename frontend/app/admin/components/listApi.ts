import { adminFetch } from './adminApi';

type Paged<T> = {
  items?: T[];
  data?: T[];
  results?: T[];
  rows?: T[];
  records?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  limit?: number;
};

/** Pull a list out of any of the common response shapes. */
export function extractList<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];

  const obj = raw as Paged<T> & { data?: Paged<T> };

  const direct = [obj.items, obj.data, obj.results, obj.rows, obj.records];
  for (const c of direct) {
    if (Array.isArray(c)) return c;
  }

  // Nested, e.g. { data: { items: [...] } } or { data: { data: [...] } }
  if (obj.data && typeof obj.data === 'object') {
    const nested = obj.data as Paged<T>;
    const inner = [nested.items, nested.data, nested.results, nested.rows, nested.records];
    for (const c of inner) {
      if (Array.isArray(c)) return c;
    }
  }

  return [];
}

/** Fetch a list endpoint and always get a plain array back. */
export async function adminFetchList<T>(url: string): Promise<T[]> {
  const raw = await adminFetch<unknown>(url);
  // TEMP DEBUG — remove after we confirm the shape
  console.log('LIST RESPONSE from', url, '→', raw);
  return extractList<T>(raw);
}