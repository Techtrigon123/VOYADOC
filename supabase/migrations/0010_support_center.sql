-- Support centre: tickets (incl. bug reports) and callback requests.
-- Run AFTER 0006: Supabase Dashboard → SQL Editor → paste → Run.
--
-- Live chat keeps using support_messages (0001). Which channels agents see, and the callback hours,
-- live in app_settings under the key 'support' (edited in Vouchlio Admin → Settings).
-- Everything here is reached only through the server-side service-role key (RLS on, no policies).

-- ─── tickets ─────────────────────────────────────────────────────────────────
create table if not exists public.support_tickets (
  id              uuid primary key default gen_random_uuid(),
  number          bigint generated always as identity,          -- shown as #1042
  agent_id        uuid not null references public.users (id) on delete cascade,
  kind            text not null default 'ticket' check (kind in ('ticket', 'bug')),
  subject         text not null check (char_length(subject) between 3 and 140),
  category        text not null default 'general'
                  check (category in ('general', 'documents', 'billing', 'account', 'technical', 'bug')),
  priority        text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status          text not null default 'open' check (status in ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  -- Bug reports: where it happened (page, browser, screen size).
  context         jsonb not null default '{}'::jsonb,
  assigned_to     uuid references public.admins (id) on delete set null,
  last_reply_from text not null default 'agent' check (last_reply_from in ('agent', 'support')),
  last_reply_at   timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index if not exists support_tickets_number_idx on public.support_tickets (number);
create index if not exists support_tickets_agent_idx on public.support_tickets (agent_id, last_reply_at desc);
create index if not exists support_tickets_queue_idx on public.support_tickets (status, last_reply_at desc);

drop trigger if exists support_tickets_updated_at on public.support_tickets;
create trigger support_tickets_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();

create table if not exists public.support_ticket_messages (
  id              uuid primary key default gen_random_uuid(),
  ticket_id       uuid not null references public.support_tickets (id) on delete cascade,
  "from"          text not null check ("from" in ('agent', 'support')),
  author_name     text,                                          -- admin name on support replies
  body            text not null check (char_length(body) between 1 and 5000),
  attachment      text,                                          -- image data URL (bug screenshots)
  attachment_type text,
  created_at      timestamptz not null default now()
);
create index if not exists support_ticket_messages_ticket_idx on public.support_ticket_messages (ticket_id, created_at);

-- ─── callback requests ───────────────────────────────────────────────────────
create table if not exists public.callback_requests (
  id              uuid primary key default gen_random_uuid(),
  agent_id        uuid not null references public.users (id) on delete cascade,
  phone           text not null check (char_length(phone) between 6 and 20),
  preferred_date  date not null,
  preferred_slot  text not null check (preferred_slot in ('morning', 'afternoon', 'evening')),
  topic           text not null check (char_length(topic) between 2 and 120),
  note            text check (note is null or char_length(note) <= 1000),
  status          text not null default 'requested' check (status in ('requested', 'scheduled', 'completed', 'cancelled', 'missed')),
  scheduled_at    timestamptz,
  admin_note      text check (admin_note is null or char_length(admin_note) <= 1000),
  handled_by      uuid references public.admins (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists callback_requests_agent_idx on public.callback_requests (agent_id, created_at desc);
create index if not exists callback_requests_queue_idx on public.callback_requests (status, preferred_date);

drop trigger if exists callback_requests_updated_at on public.callback_requests;
create trigger callback_requests_updated_at before update on public.callback_requests
  for each row execute function public.set_updated_at();

-- ─── lock it down: only the server-side service role may touch these ────────
alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.callback_requests enable row level security;

revoke all on public.support_tickets, public.support_ticket_messages, public.callback_requests from anon, authenticated;
grant select, insert, update, delete on public.support_tickets, public.support_ticket_messages, public.callback_requests to service_role;
