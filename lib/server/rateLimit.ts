// Rate-limit sederhana per kunci (per instance server, in-memory): `max` hit per `windowMs`.
// Dipakai buku tamu (F5) & Tanya pembicara (N1), 10 kiriman / menit per tamu.
export function rateLimiter(max: number, windowMs = 60_000) {
  const hits = new Map<string, number[]>();
  return function limited(key: string, now = Date.now()): boolean {
    const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    list.push(now);
    hits.set(key, list);
    return list.length > max;
  };
}
