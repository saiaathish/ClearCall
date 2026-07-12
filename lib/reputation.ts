import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { cases } from "@/data/cases";
import { calculateCalibrationScore } from "@/lib/algorithms";
import type { UserAnswer } from "@/lib/types";

type TypedClient = SupabaseClient<Database>;

const clamp = (value: number, minimum = 0, maximum = 1): number =>
  Math.min(maximum, Math.max(minimum, value));

const casesById = new Map(cases.map((item) => [item.id, item]));

export interface ReputationResult {
  score: number;
  accuracy: number;
  citationCount: number;
  helpfulAnswers: number;
}

/**
 * Computes a 0-100 reputation score from the vague BE-004 brief:
 *   40% verified agreement  – fraction of answers matching the case's
 *                              authored recommendedDecision.
 *   25% reasoning quality   – per-comment score: 0.6 for citing a rule,
 *                              plus up to 0.4 for body length (200+ chars
 *                              caps it), averaged across the user's comments.
 *   20% helpful votes       – sum of helpful_count across comments, clamped
 *                              against a cap of 20 (i.e. 20+ helpful votes
 *                              is "full marks" for this component).
 *   15% consistency         – reuses calculateCalibrationScore (Brier-loss
 *                              based) from lib/algorithms.ts.
 * These weights/caps are judgment calls since the issue only names the
 * four buckets, not their internals.
 */
export async function computeReputationScore(
  supabase: TypedClient,
  userId: string,
): Promise<ReputationResult> {
  const [answersRes, commentsRes] = await Promise.all([
    supabase
      .from("user_answers")
      .select("case_id, selected_option_id, confidence, selected_factor_keys, answered_at, initial_selected_option_id, initial_confidence, initial_selected_factor_keys, initial_answered_at, revision_count")
      .eq("user_id", userId),
    supabase
      .from("discussion_responses")
      .select("rule_citation, body, helpful_count")
      .eq("user_id", userId),
  ]);

  const answerRows = answersRes.data ?? [];
  const commentRows = commentsRes.data ?? [];

  const answers: UserAnswer[] = answerRows.map((row) => ({
    caseId: row.case_id,
    selectedOptionId: row.selected_option_id,
    confidence: row.confidence,
    selectedFactorKeys: row.selected_factor_keys ?? [],
    answeredAt: row.answered_at,
    initialAttempt: {
      selectedOptionId: row.initial_selected_option_id ?? row.selected_option_id,
      confidence: row.initial_confidence ?? row.confidence,
      selectedFactorKeys: row.initial_selected_factor_keys ?? row.selected_factor_keys ?? [],
      answeredAt: row.initial_answered_at ?? row.answered_at,
    },
    revisionCount: row.revision_count ?? 0,
  }));

  const gradedAnswers = answerRows.filter((row) => casesById.has(row.case_id));
  const agreementCount = gradedAnswers.filter(
    (row) =>
      (row.initial_selected_option_id ?? row.selected_option_id) ===
      casesById.get(row.case_id)?.recommendedDecision,
  ).length;
  const verifiedAgreement =
    gradedAnswers.length === 0 ? 0 : agreementCount / gradedAnswers.length;

  const citationCount = commentRows.filter((row) => Boolean(row.rule_citation)).length;
  const reasoningQuality =
    commentRows.length === 0
      ? 0
      : commentRows.reduce((sum, row) => {
          const citationPart = row.rule_citation ? 0.6 : 0;
          const lengthPart = clamp((row.body?.length ?? 0) / 200, 0, 0.4);
          return sum + citationPart + lengthPart;
        }, 0) / commentRows.length;

  const totalHelpful = commentRows.reduce((sum, row) => sum + (row.helpful_count ?? 0), 0);
  const helpfulVotesScore = clamp(totalHelpful / 20, 0, 1);

  const consistency = calculateCalibrationScore(answers, cases) / 100;

  const score =
    40 * verifiedAgreement +
    25 * reasoningQuality +
    20 * helpfulVotesScore +
    15 * consistency;

  return {
    score: Math.round(score * 10) / 10,
    accuracy: Math.round(verifiedAgreement * 1000) / 10,
    citationCount,
    helpfulAnswers: totalHelpful,
  };
}

/**
 * Triggers an authoritative reputation recompute for the signed-in user.
 *
 * Reputation metrics (accuracy_score, citation_count, helpful_answers,
 * reputation_score) are protected columns: the `protect_profile_metrics`
 * trigger rejects direct client writes to them, and the database recomputes
 * them from server-side data via the `recompute_reputation` SECURITY DEFINER
 * function (which uses auth.uid(), so the browser cannot spoof another user or
 * inject arbitrary scores). Database triggers on answers/comments/helpful votes
 * also keep this current; this explicit call just forces an immediate refresh.
 */
export async function persistReputationScore(
  supabase: TypedClient,
): Promise<void> {
  await supabase.rpc("recompute_reputation");
}

/**
 * Toggles a helpful vote on a discussion response via the
 * `toggle_helpful_vote` Postgres function. The voter identity is derived from
 * auth.uid() inside the function — it is never passed from the client — so a
 * caller cannot spoof another user's helpful vote. The
 * comment_helpful_votes primary key prevents double counting.
 */
export async function toggleHelpfulVote(
  supabase: TypedClient,
  commentId: string,
): Promise<{ helpfulCount: number; isActive: boolean } | null> {
  const { data, error } = await supabase.rpc("toggle_helpful_vote", {
    p_comment_id: commentId,
  });

  if (error || !data || data.length === 0) return null;

  const [row] = data;
  return { helpfulCount: row.helpful_count, isActive: row.is_active };
}
