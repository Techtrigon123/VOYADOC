-- Monthly / yearly billing, grace periods and one-step payment approval.
-- Run after 0004: Dashboard → SQL Editor → paste → Run.
--
-- HOW TO ACTIVATE A PLAN after checking a UPI payment:
--   select * from public.pending_plan_payments;                 -- see what's waiting
--   select * from public.approve_plan_payment('<payment id>');  -- activate it
--   select public.reject_plan_payment('<payment id>');          -- or reject it
--
-- Renewal rules (keep the grace days in sync with GRACE_DAYS in lib/agent/plans.ts):
--   * Monthly plans get 2 grace days after they end; yearly plans get 5.
--   * Paying while the plan is still active, or during its grace period, continues from the old
--     end date — no gap, and the grace days aren't given twice.
--   * Paying after the grace period has passed starts a fresh period from the approval time.
--   * The new plan (Gold or Platinum) and cycle (monthly or yearly) apply from approval.

alter table public.users
  add column if not exists subscription_cycle text check (subscription_cycle in ('monthly', 'yearly'));

alter table public.plan_payments
  add column if not exists billing_cycle text not null default 'yearly' check (billing_cycle in ('monthly', 'yearly'));

create or replace function public.approve_plan_payment(p_payment uuid)
returns table (agent_id uuid, email text, plan text, cycle text, starts_at timestamptz, expires_at timestamptz)
language plpgsql as $$
declare
  v_pay   public.plan_payments;
  v_user  public.users;
  v_grace interval;
  v_start timestamptz;
  v_end   timestamptz;
begin
  select * into v_pay from public.plan_payments where id = p_payment for update;
  if not found then raise exception 'Payment % not found', p_payment; end if;
  if v_pay.status <> 'pending' then raise exception 'Payment % is already %', p_payment, v_pay.status; end if;

  select * into v_user from public.users where id = v_pay.agent_id for update;

  v_grace := case when coalesce(v_user.subscription_cycle, 'yearly') = 'monthly' then interval '2 days' else interval '5 days' end;

  if v_user.subscription_plan in ('gold', 'platinum')
     and v_user.subscription_expires_at is not null
     and now() < v_user.subscription_expires_at + v_grace then
    v_start := v_user.subscription_expires_at;   -- still active or in grace: continue without a gap
  else
    v_start := now();                            -- new, or lapsed past the grace period
  end if;

  v_end := v_start + case when v_pay.billing_cycle = 'monthly' then interval '1 month' else interval '1 year' end;

  update public.users
     set subscription_plan = v_pay.plan_id,
         subscription_cycle = v_pay.billing_cycle,
         subscription_expires_at = v_end
   where id = v_user.id;

  update public.plan_payments set status = 'approved' where id = v_pay.id;

  return query select v_user.id, v_user.email::text, v_pay.plan_id::text, v_pay.billing_cycle::text, v_start, v_end;
end $$;

create or replace function public.reject_plan_payment(p_payment uuid)
returns void
language plpgsql as $$
begin
  update public.plan_payments set status = 'rejected' where id = p_payment and status = 'pending';
  if not found then raise exception 'Pending payment % not found', p_payment; end if;
end $$;

-- Pending payments to review (the proof screenshot itself is in plan_payments.proof).
create or replace view public.pending_plan_payments with (security_invoker = true) as
select p.id, u.email, u.company_name, p.plan_id as plan, p.billing_cycle as cycle, p.amount_inr,
       p.payment_transaction_id, p.created_at,
       u.subscription_plan as current_plan, u.subscription_expires_at as current_expires_at
  from public.plan_payments p
  join public.users u on u.id = p.agent_id
 where p.status = 'pending'
 order by p.created_at;

revoke all on function public.approve_plan_payment(uuid) from public, anon, authenticated;
revoke all on function public.reject_plan_payment(uuid) from public, anon, authenticated;
revoke all on public.pending_plan_payments from anon, authenticated;
grant execute on function public.approve_plan_payment(uuid) to service_role;
grant execute on function public.reject_plan_payment(uuid) to service_role;
grant select on public.pending_plan_payments to service_role;
