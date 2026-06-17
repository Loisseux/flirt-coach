-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint waitlist_email_unique unique (email)
);

create index waitlist_created_at_idx on public.waitlist (created_at desc);

alter table public.waitlist enable row level security;

-- Landing page signups (anonymous visitors)
create policy "Anyone can join waitlist"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);
