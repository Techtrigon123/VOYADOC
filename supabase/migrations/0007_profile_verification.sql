-- Agent profile verification: a sub-admin checks an agent's details, a master admin approves or denies.
-- Run AFTER 0006: Supabase Dashboard → SQL Editor → paste → Run.
--
-- Statuses (users.verification_status):
--   not_submitted    profile incomplete                                       downloads blocked
--   pending          submitted, waiting for a sub-admin to check              downloads blocked
--   checked          checked by a sub-admin, waiting for a master             downloads blocked
--   approved         verified                                                 downloads allowed
--   changes_pending  approved agent edited sensitive details, to be checked   downloads allowed
--   changes_checked  those changes checked, waiting for a master             downloads allowed
--   denied           master denied; the agent sees the reason and resubmits  downloads blocked
-- The Vouchlio app moves agents between not_submitted / pending / changes_pending as they edit their
-- profile; the admin portal does check / approve / deny.

alter table public.users add column if not exists verification_status text not null default 'not_submitted'
  check (verification_status in ('not_submitted', 'pending', 'checked', 'approved', 'changes_pending', 'changes_checked', 'denied'));
alter table public.users add column if not exists verification_submitted_at       timestamptz;
alter table public.users add column if not exists verification_checked_by         uuid references public.admins (id) on delete set null;
alter table public.users add column if not exists verification_checked_at         timestamptz;
alter table public.users add column if not exists verification_decided_by         uuid references public.admins (id) on delete set null;
alter table public.users add column if not exists verification_decided_at         timestamptz;
-- Shown to the agent when denied; otherwise the reviewer's note.
alter table public.users add column if not exists verification_note               text;
-- Per-field hashes of the reviewed details: at the last decision, and at the last check.
-- Used to notice when an agent edits something after it was reviewed.
alter table public.users add column if not exists verification_fingerprint        jsonb;
alter table public.users add column if not exists verification_checked_fingerprint jsonb;
-- Which details changed since approval (for changes_pending / changes_checked).
alter table public.users add column if not exists verification_changes           text[] not null default '{}';

create index if not exists users_verification_status_idx on public.users (verification_status)
  where verification_status in ('pending', 'checked', 'changes_pending', 'changes_checked');

-- Existing accounts: already-verified agents stay approved; complete profiles go into the review queue.
update public.users set verification_status = 'approved', verification_decided_at = now()
 where is_verified and verification_status = 'not_submitted';

update public.users set verification_status = 'pending', verification_submitted_at = now()
 where verification_status = 'not_submitted'
   and coalesce(trim(company_name), '') <> ''
   and coalesce(trim(brand_logo), '') <> ''
   and coalesce(trim(address), '') <> ''
   and coalesce(trim(mobile), '') <> '';
