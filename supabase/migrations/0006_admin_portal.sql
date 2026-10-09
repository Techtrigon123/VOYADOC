-- Admin portal (voyenta-admin): admin accounts, audit log, agent notes, payment review, settings.
-- Run AFTER 0004 and 0005: Supabase Dashboard → SQL Editor → paste → Run.
--
-- After running this, create the first master admin from the voyenta-admin folder:
--   npm run create-master -- you@example.com "Your Name"
--
-- Everything here is reached only through the server-side service-role key (RLS on, no policies).

-- ─── admins ──────────────────────────────────────────────────────────────────
create table if not exists public.admins (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null unique check (email = lower(email)),
  name                  text not null check (char_length(name) between 1 and 100),
  password_hash         text not null,
  role                  text not null check (role in ('master', 'sub')),
  -- Sub-admin permissions (masters have every permission regardless of this list).
  permissions           text[] not null default '{}',
  -- Two-step verification (TOTP). The secret is stored encrypted by the admin app.
  totp_secret           text,
  totp_enabled          boolean not null default false,
  totp_last_step        bigint not null default 0,      -- stops a code being reused
  must_change_password  boolean not null default true,  -- temporary passwords must be replaced
  disabled              boolean not null default false,
  session_version       integer not null default 1,     -- bump to sign the admin out everywhere
  last_login_at         timestamptz,
  created_by            uuid references public.admins (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists admins_updated_at on public.admins;
create trigger admins_updated_at before update on public.admins
  for each row execute function public.set_updated_at();

-- ─── audit log (append-only) ─────────────────────────────────────────────────
create table if not exists public.admin_audit_log (
  id           bigint generated always as identity primary key,
  admin_id     uuid references public.admins (id) on delete set null,
  admin_email  text,
  action       text not null,          -- e.g. 'payment.approve', 'agent.suspend', 'login.failed'
  target_type  text,                   -- 'agent' | 'payment' | 'admin' | 'settings' | …
  target_id    text,
  details      jsonb not null default '{}'::jsonb,   -- before / after values, notes
  ip           text,
  created_at   timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log (target_type, target_id);

-- Nobody — not even a master admin — can edit or delete audit entries.
create or replace function public.admin_audit_log_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'The admin audit log is append-only';
end $$;

drop trigger if exists admin_audit_log_no_update on public.admin_audit_log;
create trigger admin_audit_log_no_update before update or delete on public.admin_audit_log
  for each row execute function public.admin_audit_log_immutable();

-- ─── internal notes on agents ────────────────────────────────────────────────
create table if not exists public.agent_notes (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null references public.users (id) on delete cascade,
  admin_id    uuid references public.admins (id) on delete set null,
  admin_name  text not null,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create index if not exists agent_notes_agent_idx on public.agent_notes (agent_id, created_at desc);

-- ─── plan payment review ─────────────────────────────────────────────────────
-- Sub-admins "check" a payment proof; a master approves, rejects or refunds it.
alter table public.plan_payments add column if not exists reviewed_by  uuid references public.admins (id) on delete set null;
alter table public.plan_payments add column if not exists reviewed_at  timestamptz;
alter table public.plan_payments add column if not exists review_note  text;
alter table public.plan_payments add column if not exists decided_by   uuid references public.admins (id) on delete set null;
alter table public.plan_payments add column if not exists decided_at   timestamptz;
alter table public.plan_payments add column if not exists refunded_at  timestamptz;

alter table public.plan_payments drop constraint if exists plan_payments_status_check;
alter table public.plan_payments add constraint plan_payments_status_check
  check (status in ('pending', 'approved', 'rejected', 'refunded'));

-- ─── site settings (edited by master admins, read by the Vouchlio app) ───────
create table if not exists public.app_settings (
  key         text primary key,        -- 'payments' | 'pricing' | 'ai'
  value       jsonb not null,
  updated_by  uuid references public.admins (id) on delete set null,
  updated_at  timestamptz not null default now()
);

-- ─── lock it down: only the server-side service role may touch these ────────
alter table public.admins enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.agent_notes enable row level security;
alter table public.app_settings enable row level security;

revoke all on public.admins, public.admin_audit_log, public.agent_notes, public.app_settings from anon, authenticated;
grant select, insert, update, delete on public.admins, public.agent_notes, public.app_settings to service_role;
grant select, insert on public.admin_audit_log to service_role;
