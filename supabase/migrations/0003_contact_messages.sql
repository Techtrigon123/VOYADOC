-- Messages from the public Contact page ("Talk to Us").
-- Run after 0002: Dashboard → SQL Editor → paste → Run.
-- Read them in the Table Editor (public.contact_messages).

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  email       text not null check (char_length(email) <= 200),
  phone       text check (char_length(phone) <= 30),
  company     text check (char_length(company) <= 200),
  topic       text not null default 'general',
  message     text not null check (char_length(message) between 1 and 4000),
  status      text not null default 'new' check (status in ('new', 'replied', 'closed')),
  created_at  timestamptz not null default now()
);

create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
