-- Optional migration for First Issue Challenge persistence.
-- Safe to run even if columns already exist.

alter table public.profiles
  add column if not exists challenge_started_at timestamptz,
  add column if not exists challenge_completed_at timestamptz;

-- Backfill challenge start for existing users with profile creation date.
update public.profiles
set challenge_started_at = created_at
where challenge_started_at is null;
