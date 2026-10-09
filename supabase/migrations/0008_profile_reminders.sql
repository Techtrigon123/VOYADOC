-- One-time "complete your profile" reminder email.
-- Run AFTER 0007: Supabase Dashboard → SQL Editor → paste → Run.
--
-- /api/cron/profile-reminder emails agents who signed up but never finished quick setup,
-- then stamps profile_reminder_sent_at. A stamped agent is never emailed again.

alter table public.users add column if not exists profile_reminder_sent_at timestamptz;

-- The cron job only ever looks at agents who haven't been reminded yet.
create index if not exists users_profile_reminder_pending_idx on public.users (created_at)
  where profile_reminder_sent_at is null;
