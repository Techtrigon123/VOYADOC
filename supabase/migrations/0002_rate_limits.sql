-- Rate limiting for sensitive endpoints (login, signup, password reset…).
-- Run after 0001_init.sql: Dashboard → SQL Editor → paste → Run.
--
-- Fixed-window counters, one row per key (e.g. "auth:login:ip:1.2.3.4").
-- rate_limit_hit() counts the attempt and reports whether it is allowed,
-- atomically, so parallel requests can't slip past the limit.

create table if not exists public.rate_limits (
  key           text primary key,
  window_start  timestamptz not null default now(),
  count         integer not null default 0
);

create index if not exists rate_limits_window_idx on public.rate_limits (window_start);

create or replace function public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql as $$
declare
  v_count integer;
  v_start timestamptz;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case
                  when r.window_start + make_interval(secs => p_window_seconds) <= now() then 1
                  else r.count + 1
                end,
        window_start = case
                  when r.window_start + make_interval(secs => p_window_seconds) <= now() then now()
                  else r.window_start
                end
  returning r.count, r.window_start into v_count, v_start;

  -- Occasionally sweep counters that expired more than a day ago.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return query select v_count <= p_limit,
                      greatest(p_limit - v_count, 0),
                      v_start + make_interval(secs => p_window_seconds);
end $$;

alter table public.rate_limits enable row level security;
revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
