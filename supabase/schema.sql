-- HMD Event Companion · skema Supabase (jalankan sekali di SQL Editor project Supabase).
-- Seluruh data app = satu baris JSON (lib/data/supabase.ts). RLS aktif tanpa policy: hanya
-- service key di server Vercel yang bisa baca/tulis; anon key nggak dapat apa-apa.

create table if not exists public.hmd_store (
  id text primary key,
  rev bigint not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.hmd_pin (
  client_key text primary key,
  fails integer not null default 0,
  locked_until bigint not null default 0
);

alter table public.hmd_store enable row level security;
alter table public.hmd_pin enable row level security;
