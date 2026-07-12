-- Keep the first submitted decision immutable for calibration while allowing
-- the visible/current response to be revised.
alter table public.user_answers
  add column if not exists initial_selected_option_id text,
  add column if not exists initial_confidence integer check (
    initial_confidence is null or initial_confidence between 50 and 100
  ),
  add column if not exists initial_selected_factor_keys text[],
  add column if not exists initial_answered_at timestamptz,
  add column if not exists revision_count integer not null default 0 check (revision_count >= 0);

update public.user_answers
set
  initial_selected_option_id = coalesce(initial_selected_option_id, selected_option_id),
  initial_confidence = coalesce(initial_confidence, confidence),
  initial_selected_factor_keys = coalesce(initial_selected_factor_keys, selected_factor_keys),
  initial_answered_at = coalesce(initial_answered_at, answered_at)
where
  initial_selected_option_id is null
  or initial_confidence is null
  or initial_selected_factor_keys is null
  or initial_answered_at is null;

comment on column public.user_answers.initial_selected_option_id is
  'Immutable first submitted option used for calibration and learning metrics.';
comment on column public.user_answers.revision_count is
  'Number of current-response updates made after the first submission.';

-- The first attempt is authoritative history, not client-owned state. Fill it
-- on insert and preserve it on every update even if a caller sends different
-- initial_* values. The revision counter is server-owned for the same reason.
create or replace function public.preserve_user_answer_initial_attempt()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.initial_selected_option_id := new.selected_option_id;
    new.initial_confidence := new.confidence;
    new.initial_selected_factor_keys := new.selected_factor_keys;
    new.initial_answered_at := new.answered_at;
    new.revision_count := 0;
    return new;
  end if;

  new.initial_selected_option_id := coalesce(
    old.initial_selected_option_id,
    old.selected_option_id
  );
  new.initial_confidence := coalesce(old.initial_confidence, old.confidence);
  new.initial_selected_factor_keys := coalesce(
    old.initial_selected_factor_keys,
    old.selected_factor_keys
  );
  new.initial_answered_at := coalesce(old.initial_answered_at, old.answered_at);

  if (new.selected_option_id, new.confidence, new.selected_factor_keys)
       is distinct from
     (old.selected_option_id, old.confidence, old.selected_factor_keys)
  then
    new.revision_count := coalesce(old.revision_count, 0) + 1;
  else
    new.revision_count := coalesce(old.revision_count, 0);
  end if;

  return new;
end $$;

drop trigger if exists preserve_initial_attempt on public.user_answers;
create trigger preserve_initial_attempt before insert or update on public.user_answers
  for each row execute function public.preserve_user_answer_initial_attempt();

-- Trigger functions should not be exposed as RPC endpoints.
revoke all on function public.preserve_user_answer_initial_attempt()
  from public, anon, authenticated;

-- Reputation remains anchored to the first attempt, so revising after the
-- authored evidence is visible cannot rewrite calibration history.
create or replace function public.recompute_user_reputation(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_graded int; v_agree int; v_agreement numeric := 0;
  v_reasoning numeric := 0; v_helpful_sum int := 0; v_helpful numeric := 0;
  v_citations int := 0; v_brier numeric; v_consistency numeric := 0; v_score numeric;
begin
  select count(*) filter (where c.recommended_decision is not null),
         count(*) filter (where c.recommended_decision is not null
                            and coalesce(ua.initial_selected_option_id, ua.selected_option_id)
                              = c.recommended_decision)
    into v_graded, v_agree
  from public.user_answers ua
  join public.cases c on c.id = ua.case_id
  where ua.user_id = p_user_id;
  if v_graded > 0 then v_agreement := v_agree::numeric / v_graded; end if;

  select coalesce(avg(
           (case when nullif(trim(coalesce(rule_citation, '')), '') is not null then 0.6 else 0 end)
           + least(0.4, char_length(coalesce(body, '')) / 200.0)), 0),
         count(*) filter (where nullif(trim(coalesce(rule_citation, '')), '') is not null)
    into v_reasoning, v_citations
  from public.discussion_responses where user_id = p_user_id;

  select coalesce(sum(helpful_count), 0) into v_helpful_sum
  from public.discussion_responses where user_id = p_user_id;
  v_helpful := least(1.0, v_helpful_sum::numeric / 20.0);

  if v_graded > 0 then
    select 1 - avg(power((coalesce(ua.initial_confidence, ua.confidence)::numeric / 100.0)
                    - (case when coalesce(ua.initial_selected_option_id, ua.selected_option_id)
                                   = c.recommended_decision then 1 else 0 end), 2))
      into v_brier
    from public.user_answers ua
    join public.cases c on c.id = ua.case_id
    where ua.user_id = p_user_id and c.recommended_decision is not null;
    v_consistency := greatest(0, least(1, coalesce(v_brier, 0)));
  end if;

  v_score := 100 * (0.40 * v_agreement + 0.25 * v_reasoning
                    + 0.20 * v_helpful + 0.15 * v_consistency);
  v_score := greatest(0, least(100, round(v_score, 1)));

  perform set_config('clearcall.allow_metric_write', 'on', true);
  update public.profiles set
    accuracy_score   = round(v_agreement * 100, 1),
    citation_count   = v_citations,
    helpful_answers  = v_helpful_sum,
    reputation_score = v_score
  where id = p_user_id;
  perform set_config('clearcall.allow_metric_write', 'off', true);
end $$;
