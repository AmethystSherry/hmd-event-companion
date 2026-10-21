// Konfigurasi rahasia dari env (hanya server). Nilai asli di .env.local, tidak pernah di repo.

export type Secrets = {
  eventPin: string | null; // 6 digit; null = login panitia nonaktif
  guestTokenSecret: string;
  ticketSecret: string;
  sessionSecret: string;
};

function required(name: string): string {
  const v = process.env[name];
  if (v && v.length >= 32) return v;
  throw new Error(
    `${name} belum diisi (min. 32 karakter acak). Salin .env.example → .env.local lalu isi.`,
  );
}

let cached: Secrets | undefined;

export function secrets(): Secrets {
  if (cached) return cached;
  const pin = process.env.EVENT_PIN?.trim() || null;
  if (pin && !/^\d{6}$/.test(pin)) throw new Error("EVENT_PIN harus 6 digit angka.");
  cached = {
    eventPin: pin,
    guestTokenSecret: required("GUEST_TOKEN_SECRET"),
    ticketSecret: required("TICKET_HMAC_SECRET"),
    sessionSecret: required("SESSION_SECRET"),
  };
  return cached;
}
