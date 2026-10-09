-- Let admins be deleted without touching the append-only audit log.
-- Run AFTER 0006: Supabase Dashboard → SQL Editor → paste → Run.
--
-- admin_audit_log.admin_id used to reference admins(id) with ON DELETE SET NULL. Deleting an admin
-- made Postgres UPDATE their audit rows, which the immutability trigger (correctly) rejects.
-- Dropping the foreign key keeps the original admin id (and admin_email) in the log forever.

alter table public.admin_audit_log drop constraint if exists admin_audit_log_admin_id_fkey;

create index if not exists admin_audit_log_admin_idx on public.admin_audit_log (admin_id);
