-- ============================================================================
--  KruMath · Face Match Memorization
--  Adds the table and private storage bucket used by
--  https://krumath.com/face-match-memorization
--
--  HOW TO RUN
--    Supabase dashboard -> SQL Editor -> New query -> paste this whole file -> Run
--
--  SAFE TO RUN MORE THAN ONCE
--    Every statement below is idempotent, so re-running it will not error or
--    duplicate anything.
--
--  WHAT IT TOUCHES
--    Creates  : public.face_match_people, bucket 'face-match-photos'
--    Policies : 1 table policy + 4 storage policies (all new)
--    Alters   : adds face_match_people.collection to installs created before it
--               existed, and rebuilds the one index to include that column
--    Reads    : nothing
--
--  ONE ROW IS ONE PICTURE PLUS ONE LABEL
--    The table is deliberately generic: `name` holds whatever the user must
--    recall (a person's name, a word, a term) and `photo_path` points at the
--    picture they see. `collection` is the user-named deck that groups items so
--    two subjects never share a quiz. Rows saved before collections existed are
--    backfilled into the deck named 'People' by the column default.
--
--  READ THIS BEFORE RUNNING
--    The two checks that keep one user's photos away from another user are:
--      auth.uid() = user_id
--      (storage.foldername(name))[1] = auth.uid()::text
--    If either is missing or altered, users can read each other's photos.
-- ============================================================================


-- ============================================================================
-- 1. Table
-- ============================================================================
create table if not exists public.face_match_people (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  collection text not null default 'People',
  name       text not null,
  photo_path text not null,
  correct    integer not null default 0,
  wrong      integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.face_match_people is
  'Memorisation items for the KruMemory tool: one row per picture+label pair. The name is historical; the table is not face-specific. Pictures live in the private face-match-photos bucket.';


-- ============================================================================
-- 1b. Upgrade an install created before collections existed.
--     The default is what puts every pre-existing row into the deck 'People'.
--     It is left in place as a safety net for any insert that forgets the
--     column rather than erroring.
-- ============================================================================
alter table public.face_match_people
  add column if not exists collection text not null default 'People';

comment on column public.face_match_people.collection is
  'User-named deck the item belongs to: People, French words, Physics, ... Free text; the UI normalises whitespace and matches names case-insensitively.';


-- ============================================================================
-- 2. Row level security
--    Anonymous Supabase sessions carry a real JWT, so they land in the
--    `authenticated` role and `auth.uid()` alone would not exclude them.
--    The is_anonymous claim check is what actually blocks them.
-- ============================================================================
alter table public.face_match_people enable row level security;

drop policy if exists "face_match_people own rows" on public.face_match_people;
create policy "face_match_people own rows"
  on public.face_match_people
  for all
  to authenticated
  using (
    auth.uid() = user_id
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
  )
  with check (
    auth.uid() = user_id
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
  );


-- ============================================================================
-- 3. Index
--    Dropped first because `create index if not exists` matches on the name
--    alone: with the old name still in place the new column list would be
--    silently ignored. Both statements are safe to re-run.
-- ============================================================================
drop index if exists public.face_match_people_user_idx;
create index if not exists face_match_people_user_idx
  on public.face_match_people (user_id, collection, created_at);


-- ============================================================================
-- 4. Private storage bucket
--    public = false, so files are only reachable through short-lived signed URLs.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('face-match-photos', 'face-match-photos', false)
on conflict (id) do nothing;


-- ============================================================================
-- 5. Storage policies
--    Photos are stored at '<user_id>/<uuid>.<ext>', so folder segment 1 must
--    equal the caller's uid. Users can only see and touch their own folder.
-- ============================================================================
drop policy if exists "face-match photos read own" on storage.objects;
create policy "face-match photos read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'face-match-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
  );

drop policy if exists "face-match photos insert own" on storage.objects;
create policy "face-match photos insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'face-match-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
  );

drop policy if exists "face-match photos update own" on storage.objects;
create policy "face-match photos update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'face-match-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
  )
  with check (
    bucket_id = 'face-match-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
  );

drop policy if exists "face-match photos delete own" on storage.objects;
create policy "face-match photos delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'face-match-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
  );


-- ============================================================================
-- 6. Confirm it worked
--    Expect: rls_enabled = true, policy_count = 1, bucket private = false+1 row,
--    storage_policies = 4, and no row left with a null collection.
-- ============================================================================
-- select
--   (select relrowsecurity from pg_class where oid = 'public.face_match_people'::regclass) as rls_enabled,
--   (select count(*) from pg_policies
--      where schemaname = 'public' and tablename = 'face_match_people')                as policy_count,
--   (select count(*) from storage.buckets where id = 'face-match-photos')             as bucket_count,
--   (select public from storage.buckets where id = 'face-match-photos')               as bucket_is_public,
--   (select count(*) from pg_policies
--      where schemaname = 'storage' and policyname like 'face-match photos%')         as storage_policies,
--   (select count(*) from public.face_match_people where collection is null)          as rows_without_collection,
--   (select string_agg(distinct collection, ', ' order by collection)
--      from public.face_match_people)                                                 as collections;


-- ============================================================================
-- 7. ROLLBACK - run this only to undo everything above.
--    Commented out on purpose. Deleting rows is irreversible.
-- ============================================================================
-- drop policy if exists "face_match_people own rows"      on public.face_match_people;
-- drop index  if exists public.face_match_people_user_idx;
--
-- -- Drops the collection column and every deck grouping with it.
-- alter table public.face_match_people drop column if exists collection;
--
-- drop table  if exists public.face_match_people;
--
-- drop policy if exists "face-match photos read own"   on storage.objects;
-- drop policy if exists "face-match photos insert own" on storage.objects;
-- drop policy if exists "face-match photos update own" on storage.objects;
-- drop policy if exists "face-match photos delete own" on storage.objects;
--
-- -- Remove the stored files first; deleting the bucket alone leaves objects behind.
-- delete from storage.objects where bucket_id = 'face-match-photos';
-- delete from storage.buckets where id = 'face-match-photos';
