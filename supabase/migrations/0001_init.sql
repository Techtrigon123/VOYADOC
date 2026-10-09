-- Vouchlio — initial schema.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run
-- (or `supabase db push` with the Supabase CLI).
--
-- The app talks to these tables only from the server with the service-role key.
-- Row Level Security is ON with no policies, so the public anon key can read nothing.

create extension if not exists pgcrypto;

-- ─── updated_at helper ──────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─── users (agents) ─────────────────────────────────────────────────────────
create table if not exists public.users (
  id                              uuid primary key default gen_random_uuid(),
  name                            text not null check (char_length(name) between 1 and 100),
  email                           text not null unique check (email = lower(email)),
  password_hash                   text not null,
  organization                    text,
  role                            text not null default 'owner' check (role in ('owner', 'admin', 'staff')),
  reset_token                     text,
  reset_token_expiry              timestamptz,

  -- agent profile
  mobile                          text,
  landline_number                 text,
  brand_name                      text,
  company_name                    text,
  partner_type                    text check (partner_type in ('travel_agent', 'tour_operator', 'dmc', 'hotel', 'other')),
  partner_type_other              text,
  address                         text,
  city                            text,
  state                           text,
  country                         text default 'India',
  pincode                         text,
  gst_number                      text,
  iata_number                     text,
  brand_logo                      text,   -- image data URL
  company_stamp                   text,   -- image data URL
  bank_account_holder             text,
  bank_name                       text,
  bank_account_number             text,
  bank_ifsc_code                  text,
  bank_branch_address             text,
  payment_upi                     text,

  -- account state
  status                          text not null default 'INACTIVE' check (status in ('INACTIVE', 'ACTIVE', 'SUSPENDED')),
  is_verified                     boolean not null default false,
  agent_level                     text default 'Normal',
  subscription_plan               text not null default 'silver' check (subscription_plan in ('silver', 'gold', 'platinum')),
  subscription_expires_at         timestamptz,

  -- feature switches
  air_ticketing_enabled           boolean not null default true,
  travel_service_voucher_enabled  boolean not null default true,
  welcome_placard_enabled         boolean not null default true,

  document_number_settings        jsonb not null default '{"invoicePrefix":"INV-","proformaPrefix":"PI-","receiptPrefix":"RCPT-","digits":4}'::jsonb,
  extract_usage                   jsonb not null default '{"day":"","voucher":0,"airTicket":0,"yearTotal":0}'::jsonb,

  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create unique index if not exists users_reset_token_idx on public.users (reset_token) where reset_token is not null;
drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- ─── agent_documents (vouchers, tickets, pickups, placards, invoices…) ──────
create table if not exists public.agent_documents (
  id                uuid primary key default gen_random_uuid(),
  agent_id          uuid not null references public.users (id) on delete cascade,
  kind              text not null check (kind in ('hotel_voucher', 'air_ticket', 'pickup_voucher', 'welcome_placard', 'invoice', 'proforma', 'receipt')),
  title             text not null,
  subtitle          text,
  number            text,
  group_key         text,
  version           integer not null default 1,
  status            text,
  data              jsonb not null default '{}'::jsonb,
  pdf_generated_at  timestamptz,
  currency          text,
  total             numeric(14, 2),
  paid_amount       numeric(14, 2) not null default 0,
  parent_id         uuid references public.agent_documents (id) on delete set null,
  search_text       text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists agent_documents_agent_kind_created_idx on public.agent_documents (agent_id, kind, created_at desc);
create index if not exists agent_documents_agent_number_idx on public.agent_documents (agent_id, kind, number);
create index if not exists agent_documents_group_idx on public.agent_documents (agent_id, group_key);
create index if not exists agent_documents_parent_idx on public.agent_documents (parent_id);
create index if not exists agent_documents_created_idx on public.agent_documents (created_at);
drop trigger if exists agent_documents_updated_at on public.agent_documents;
create trigger agent_documents_updated_at before update on public.agent_documents
  for each row execute function public.set_updated_at();

-- ─── customers (saved invoice customers) ────────────────────────────────────
create table if not exists public.customers (
  id               uuid primary key default gen_random_uuid(),
  agent_id         uuid not null references public.users (id) on delete cascade,
  name             text not null,
  company          text,
  email            text,
  phone            text,
  gst_treatment    text,
  gstin            text,
  place_of_supply  text,
  pan              text,
  address          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists customers_agent_idx on public.customers (agent_id, updated_at desc);
drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

-- ─── plan_payments (Gold / Platinum UPI proofs awaiting review) ─────────────
create table if not exists public.plan_payments (
  id                      uuid primary key default gen_random_uuid(),
  agent_id                uuid not null references public.users (id) on delete cascade,
  plan_id                 text not null check (plan_id in ('gold', 'platinum')),
  amount_inr              integer not null,
  payment_transaction_id  text not null,
  proof                   text not null,  -- image or PDF data URL
  proof_type              text not null default 'image/png',
  status                  text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists plan_payments_agent_idx on public.plan_payments (agent_id, status, created_at desc);
drop trigger if exists plan_payments_updated_at on public.plan_payments;
create trigger plan_payments_updated_at before update on public.plan_payments
  for each row execute function public.set_updated_at();

-- ─── support_messages ───────────────────────────────────────────────────────
create table if not exists public.support_messages (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null references public.users (id) on delete cascade,
  "from"      text not null check ("from" in ('agent', 'support')),
  body        text not null check (char_length(body) <= 4000),
  created_at  timestamptz not null default now()
);

create index if not exists support_messages_agent_idx on public.support_messages (agent_id, created_at);

-- ─── Dashboard helpers ──────────────────────────────────────────────────────
-- Documents per kind for one agent.
create or replace function public.agent_document_counts(p_agent uuid)
returns table (kind text, count bigint)
language sql stable as $$
  select kind, count(*) from public.agent_documents where agent_id = p_agent group by kind;
$$;

-- Activity board: this agent's document count since p_since and its rank among all agents.
create or replace function public.agent_activity_rank(p_agent uuid, p_since timestamptz)
returns table (activity_score bigint, rank bigint)
language sql stable as $$
  with board as (
    select agent_id, count(*) as score,
           row_number() over (order by count(*) desc, agent_id) as rnk
    from public.agent_documents
    where created_at >= p_since
    group by agent_id
  )
  select coalesce((select score from board where agent_id = p_agent), 0),
         (select rnk from board where agent_id = p_agent);
$$;

-- ─── Lock everything down to the server (service role bypasses RLS) ───────
alter table public.users            enable row level security;
alter table public.agent_documents  enable row level security;
alter table public.customers        enable row level security;
alter table public.plan_payments    enable row level security;
alter table public.support_messages enable row level security;

revoke all on function public.agent_document_counts(uuid) from public, anon, authenticated;
revoke all on function public.agent_activity_rank(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.agent_document_counts(uuid) to service_role;
grant execute on function public.agent_activity_rank(uuid, timestamptz) to service_role;
