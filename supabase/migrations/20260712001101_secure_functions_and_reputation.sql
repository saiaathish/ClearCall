-- ===========================================================================
-- 1. Helpful-vote spoofing fix (BE-003): identity is auth.uid(), never an arg.
-- ===========================================================================
create or replace function public.toggle_helpful_vote(p_comment_id uuid)
returns table(helpful_count integer, is_active boolean)
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); active boolean; total integer;
begin
  if uid is null then raise exception 'authentication required'; end if;
  if not exists (select 1 from public.discussion_responses where id = p_comment_id) then
    raise exception 'comment not found';
  end if;
  if exists (select 1 from public.comment_helpful_votes
             where comment_id = p_comment_id and user_id = uid) then
    delete from public.comment_helpful_votes
      where comment_id = p_comment_id and user_id = uid;
    active := false;
  else
    insert into public.comment_helpful_votes (comment_id, user_id)
      values (p_comment_id, uid) on conflict do nothing;
    active := true;
  end if;
  select count(*) into total from public.comment_helpful_votes where comment_id = p_comment_id;
  update public.discussion_responses set helpful_count = total where id = p_comment_id;
  return query select total, active;
end $$;

-- Remove the insecure caller-supplied-identity overload entirely.
drop function if exists public.toggle_helpful_vote(uuid, uuid);
revoke all on function public.toggle_helpful_vote(uuid) from public, anon;
grant execute on function public.toggle_helpful_vote(uuid) to authenticated;

-- ===========================================================================
-- 2. Protect authoritative profile metrics from direct client writes (BE-004).
--    Trusted recompute sets a txn-local flag to permit its own update.
-- ===========================================================================
create or replace function public.protect_profile_metrics()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('clearcall.allow_metric_write', true), '') <> 'on'
     and (new.is_verified, new.accuracy_score, new.citation_count,
          new.helpful_answers, new.reputation_score)
         is distinct from
         (old.is_verified, old.accuracy_score, old.citation_count,
          old.helpful_answers, old.reputation_score)
  then
    raise exception 'protected profile metrics cannot be modified directly';
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_metrics on public.profiles;
create trigger protect_profile_metrics before update on public.profiles
  for each row execute function public.protect_profile_metrics();

-- ===========================================================================
-- 3. Authoritative reputation (BE-004): 40% agreement, 25% reasoning,
--    20% helpful votes, 15% consistency. Computed & written server-side only.
-- ===========================================================================
create or replace function public.recompute_user_reputation(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_graded int; v_agree int; v_agreement numeric := 0;
  v_reasoning numeric := 0; v_helpful_sum int := 0; v_helpful numeric := 0;
  v_citations int := 0; v_brier numeric; v_consistency numeric := 0; v_score numeric;
begin
  -- 40% verified agreement: fraction of graded answers matching recommended_decision
  select count(*) filter (where c.recommended_decision is not null),
         count(*) filter (where c.recommended_decision is not null
                            and ua.selected_option_id = c.recommended_decision)
    into v_graded, v_agree
  from public.user_answers ua
  join public.cases c on c.id = ua.case_id
  where ua.user_id = p_user_id;
  if v_graded > 0 then v_agreement := v_agree::numeric / v_graded; end if;

  -- 25% reasoning quality: 0.6 for a rule citation + up to 0.4 for body length
  select coalesce(avg(
           (case when nullif(trim(coalesce(rule_citation, '')), '') is not null then 0.6 else 0 end)
           + least(0.4, char_length(coalesce(body, '')) / 200.0)), 0),
         count(*) filter (where nullif(trim(coalesce(rule_citation, '')), '') is not null)
    into v_reasoning, v_citations
  from public.discussion_responses where user_id = p_user_id;

  -- 20% helpful votes: total helpful_count capped at 20
  select coalesce(sum(helpful_count), 0) into v_helpful_sum
  from public.discussion_responses where user_id = p_user_id;
  v_helpful := least(1.0, v_helpful_sum::numeric / 20.0);

  -- 15% consistency: 1 - Brier loss of confidence vs. correctness over graded answers
  if v_graded > 0 then
    select 1 - avg(power((ua.confidence::numeric / 100.0)
                    - (case when ua.selected_option_id = c.recommended_decision then 1 else 0 end), 2))
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

-- Public entry point: recompute only for the authenticated caller.
create or replace function public.recompute_reputation()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  perform public.recompute_user_reputation(auth.uid());
end $$;

revoke all on function public.recompute_user_reputation(uuid) from public, anon, authenticated;
revoke all on function public.recompute_reputation() from public, anon;
grant execute on function public.recompute_reputation() to authenticated;

-- Triggers: keep reputation authoritative after any authored / helpful change.
create or replace function public.trg_reputation_from_authored()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_user uuid := coalesce(new.user_id, old.user_id);
begin
  if v_user is not null then perform public.recompute_user_reputation(v_user); end if;
  return null;
end $$;

create or replace function public.trg_reputation_from_helpful()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  select user_id into v_author from public.discussion_responses
    where id = coalesce(new.comment_id, old.comment_id);
  if v_author is not null then perform public.recompute_user_reputation(v_author); end if;
  return null;
end $$;

drop trigger if exists reputation_on_answers on public.user_answers;
create trigger reputation_on_answers after insert or update or delete on public.user_answers
  for each row execute function public.trg_reputation_from_authored();
drop trigger if exists reputation_on_comments on public.discussion_responses;
create trigger reputation_on_comments after insert or update or delete on public.discussion_responses
  for each row execute function public.trg_reputation_from_authored();
drop trigger if exists reputation_on_helpful on public.comment_helpful_votes;
create trigger reputation_on_helpful after insert or delete on public.comment_helpful_votes
  for each row execute function public.trg_reputation_from_helpful();
