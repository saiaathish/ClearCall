-- BACKFILL phase: derive canonical relational columns from legacy data jsonb.
-- Defensive: coalesce keeps any already-set value; nullif(trim()) drops blanks.
-- Source key mapping (data jsonb -> column):
--   sport                <- data.sport
--   incident             <- data.prompt | data.title | ''
--   video_url            <- data.videoSrc
--   description          <- data.description | ''
--   official_decision    <- data.originalDecision | ''
--   recommended_decision <- data.recommendedDecision (nullable, used for grading)
--   options              <- data.answerOptions (jsonb array)
--   factors              <- data.factors (jsonb array/object)
--   difficulty_score     <- map(data.difficulty | difficulty) beginner .25 / intermediate .5 / advanced .85
update public.cases set
  sport                = coalesce(sport, nullif(trim(data->>'sport'), '')),
  incident             = coalesce(incident, nullif(trim(data->>'prompt'), ''),
                                  nullif(trim(data->>'title'), ''), ''),
  video_url            = coalesce(video_url, nullif(trim(data->>'videoSrc'), '')),
  description          = coalesce(description, nullif(trim(data->>'description'), ''), ''),
  official_decision    = coalesce(official_decision, nullif(trim(data->>'originalDecision'), ''), ''),
  recommended_decision = coalesce(recommended_decision, nullif(trim(data->>'recommendedDecision'), '')),
  options              = coalesce(options,
                           case when jsonb_typeof(data->'answerOptions') = 'array'
                                then data->'answerOptions' else '[]'::jsonb end),
  factors              = coalesce(factors,
                           case when jsonb_typeof(data->'factors') in ('array','object')
                                then data->'factors' else '[]'::jsonb end),
  difficulty_score     = coalesce(difficulty_score,
                           case lower(coalesce(nullif(trim(data->>'difficulty'), ''), difficulty))
                                when 'beginner'     then 0.25
                                when 'intermediate' then 0.50
                                when 'advanced'     then 0.85
                                else 0.50 end);

-- Validate: no required column may be null before we tighten constraints.
do $$
declare n int;
begin
  select count(*) into n from public.cases
   where sport is null or incident is null or description is null
      or official_decision is null or options is null or factors is null
      or difficulty_score is null;
  if n > 0 then
    raise exception 'backfill incomplete: % cases rows still missing required fields', n;
  end if;
end $$;

alter table public.cases
  alter column sport set not null,
  alter column incident set not null,
  alter column description set not null,
  alter column official_decision set not null,
  alter column options set not null,
  alter column factors set not null,
  alter column difficulty_score set not null;
