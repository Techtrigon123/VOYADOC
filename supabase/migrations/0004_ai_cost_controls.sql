-- AI cost controls for upload auto-fill (Claude API).
-- Run after 0003: Dashboard → SQL Editor → paste → Run.
--
-- Every AI call first *reserves* its worst-case cost with ai_reserve(), which checks
-- all limits and counts the call atomically (parallel uploads can't slip past a limit),
-- then *settles* the real cost from the API's token usage with ai_settle().
-- Money is stored in micro-dollars (1 USD = 1,000,000) to keep integer maths.

create table if not exists public.ai_usage_daily (
  day            date primary key,               -- UTC day
  calls          integer not null default 0,
  free_calls     integer not null default 0,     -- calls made by free (Silver) accounts
  input_tokens   bigint  not null default 0,
  output_tokens  bigint  not null default 0,
  cost_micros    bigint  not null default 0      -- reserved + settled spend, USD × 1e6
);

create table if not exists public.ai_usage_user_daily (
  user_id  uuid not null references public.users(id) on delete cascade,
  day      date not null,
  kind     text not null,                        -- 'voucher' | 'ticket'
  calls    integer not null default 0,
  primary key (user_id, day, kind)
);

create index if not exists ai_usage_user_daily_day_idx on public.ai_usage_user_daily (day);

/**
 * Reserve one AI call. Returns 'ok' or the name of the limit that blocked it:
 *   daily_budget | monthly_budget | free_pool | user_daily | plan_limit
 * p_user_kind_limit: the plan's per-day allowance for this kind (null = no per-kind limit).
 */
create or replace function public.ai_reserve(
  p_user                  uuid,
  p_kind                  text,
  p_free                  boolean,
  p_user_kind_limit       integer,
  p_user_daily_limit      integer,
  p_free_daily_calls      integer,
  p_daily_budget_micros   bigint,
  p_monthly_budget_micros bigint,
  p_reserve_micros        bigint
) returns text
language plpgsql as $$
declare
  v_day   date := (now() at time zone 'utc')::date;
  v_row   public.ai_usage_daily;
  v_month bigint;
  v_user  integer;
  v_kind  integer;
begin
  insert into public.ai_usage_daily (day) values (v_day) on conflict (day) do nothing;
  -- Lock today's row: reservations run one at a time, so limits can't be raced.
  select * into v_row from public.ai_usage_daily where day = v_day for update;

  select coalesce(sum(cost_micros), 0) into v_month
    from public.ai_usage_daily
   where day >= date_trunc('month', v_day)::date;

  if v_row.cost_micros + p_reserve_micros > p_daily_budget_micros then return 'daily_budget'; end if;
  if v_month + p_reserve_micros > p_monthly_budget_micros then return 'monthly_budget'; end if;
  if p_free and v_row.free_calls >= p_free_daily_calls then return 'free_pool'; end if;

  select coalesce(sum(calls), 0) into v_user
    from public.ai_usage_user_daily where user_id = p_user and day = v_day;
  if v_user >= p_user_daily_limit then return 'user_daily'; end if;

  if p_user_kind_limit is not null then
    select coalesce(sum(calls), 0) into v_kind
      from public.ai_usage_user_daily where user_id = p_user and day = v_day and kind = p_kind;
    if v_kind >= p_user_kind_limit then return 'plan_limit'; end if;
  end if;

  update public.ai_usage_daily
     set calls       = calls + 1,
         free_calls  = free_calls + (case when p_free then 1 else 0 end),
         cost_micros = cost_micros + p_reserve_micros
   where day = v_day;

  insert into public.ai_usage_user_daily as u (user_id, day, kind, calls)
  values (p_user, v_day, p_kind, 1)
  on conflict (user_id, day, kind) do update set calls = u.calls + 1;

  return 'ok';
end $$;

/**
 * Replace a reservation with the real cost. When p_refund is true (the API was never
 * billed, e.g. it was overloaded), the call is also removed from the counters so it
 * doesn't use up the account's allowance.
 */
create or replace function public.ai_settle(
  p_day             date,
  p_user            uuid,
  p_kind            text,
  p_free            boolean,
  p_reserved_micros bigint,
  p_actual_micros   bigint,
  p_input_tokens    bigint,
  p_output_tokens   bigint,
  p_refund          boolean
) returns void
language plpgsql as $$
begin
  update public.ai_usage_daily
     set cost_micros   = greatest(0, cost_micros - p_reserved_micros + p_actual_micros),
         input_tokens  = input_tokens + p_input_tokens,
         output_tokens = output_tokens + p_output_tokens,
         calls         = calls - (case when p_refund then 1 else 0 end),
         free_calls    = free_calls - (case when p_refund and p_free then 1 else 0 end)
   where day = p_day;

  if p_refund then
    update public.ai_usage_user_daily
       set calls = greatest(0, calls - 1)
     where user_id = p_user and day = p_day and kind = p_kind;
  end if;
end $$;

alter table public.ai_usage_daily enable row level security;
alter table public.ai_usage_user_daily enable row level security;
revoke all on table public.ai_usage_daily, public.ai_usage_user_daily from anon, authenticated;
revoke all on function public.ai_reserve(uuid, text, boolean, integer, integer, integer, bigint, bigint, bigint) from public, anon, authenticated;
revoke all on function public.ai_settle(date, uuid, text, boolean, bigint, bigint, bigint, bigint, boolean) from public, anon, authenticated;
grant all on table public.ai_usage_daily, public.ai_usage_user_daily to service_role;
grant execute on function public.ai_reserve(uuid, text, boolean, integer, integer, integer, bigint, bigint, bigint) to service_role;
grant execute on function public.ai_settle(date, uuid, text, boolean, bigint, bigint, bigint, bigint, boolean) to service_role;
