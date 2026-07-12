-- EXPAND phase: add relational columns to the deployed text-id cases table.
-- Compatibility migration reconciling GitHub issues #7-#12 with the already
-- deployed schema. Preserves cases.id text and the legacy data jsonb blob.
-- Guard: fail loudly if the deployed shape is not what we expect.
do $$
begin
  if (select data_type from information_schema.columns
      where table_schema='public' and table_name='cases' and column_name='id') <> 'text' then
    raise exception 'aborting: expected public.cases.id to be text';
  end if;
  if not exists (select 1 from information_schema.columns
      where table_schema='public' and table_name='cases' and column_name='data') then
    raise exception 'aborting: expected legacy public.cases.data jsonb column to exist';
  end if;
end $$;

alter table public.cases
  add column if not exists creator_id uuid references public.profiles(id) on delete set null,
  add column if not exists sport text,
  add column if not exists incident text,
  add column if not exists video_url text,
  add column if not exists description text,
  add column if not exists difficulty_score numeric,
  add column if not exists official_decision text,
  add column if not exists recommended_decision text,
  add column if not exists options jsonb,
  add column if not exists factors jsonb,
  add column if not exists status text not null default 'active';

-- Constraints that both legacy-backfilled and future rows must satisfy.
alter table public.cases
  drop constraint if exists cases_difficulty_score_range,
  add constraint cases_difficulty_score_range
    check (difficulty_score is null or (difficulty_score >= 0 and difficulty_score <= 1));
alter table public.cases
  drop constraint if exists cases_options_is_array,
  add constraint cases_options_is_array
    check (options is null or jsonb_typeof(options) = 'array');
alter table public.cases
  drop constraint if exists cases_factors_is_json,
  add constraint cases_factors_is_json
    check (factors is null or jsonb_typeof(factors) in ('array','object'));

create index if not exists cases_creator_idx on public.cases(creator_id);
create index if not exists cases_sport_category_idx on public.cases(sport, category);
