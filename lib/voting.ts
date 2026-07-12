import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { Distribution } from "@/lib/types";

type TypedClient = SupabaseClient<Database>;

export interface LiveDistribution {
  /** Percentages keyed by AnswerOption.id, summing to ~100. Empty if no votes. */
  percentages: Readonly<Record<string, number>>;
  totalVotes: number;
}

export interface LiveVoteDistribution {
  community: LiveDistribution | null;
  verified: LiveDistribution | null;
}

function tally(
  rows: readonly { selected_option_id: string; role: string; vote_count: number }[],
  answerOptionIds: readonly string[],
  filterRole?: string,
): LiveDistribution | null {
  const counts: Record<string, number> = {};
  for (const id of answerOptionIds) counts[id] = 0;

  let total = 0;
  for (const row of rows) {
    if (filterRole !== undefined && row.role !== filterRole) continue;
    if (!(row.selected_option_id in counts)) continue;
    counts[row.selected_option_id] += row.vote_count;
    total += row.vote_count;
  }

  if (total === 0) return null;

  const percentages: Record<string, number> = {};
  for (const id of answerOptionIds) {
    percentages[id] = Math.round((counts[id] / total) * 100);
  }

  return { percentages, totalVotes: total };
}

/**
 * Fetches the live vote distribution for a case via the
 * `get_case_vote_distribution` Postgres function (BE-003), split into a
 * "community" breakdown (all respondents) and a "verified" breakdown
 * (profiles.role = 'verified_referee' only). Returns null for either
 * breakdown when there are zero matching votes, so callers can fall back to
 * the static authored demo distribution instead of dividing by zero.
 */
export async function fetchLiveDistribution(
  supabase: TypedClient,
  caseId: string,
  answerOptionIds: readonly string[],
): Promise<LiveVoteDistribution> {
  const { data, error } = await supabase.rpc("get_case_vote_distribution", {
    p_case_id: caseId,
  });

  if (error || !data) {
    return { community: null, verified: null };
  }

  return {
    community: tally(data, answerOptionIds),
    verified: tally(data, answerOptionIds, "verified_referee"),
  };
}

/**
 * Returns a Distribution using live percentages when available, falling back
 * to the authored demo distribution when there are no real votes yet.
 */
export function withLiveOverride(
  authored: Distribution,
  live: LiveDistribution | null,
): Distribution {
  if (!live) return authored;
  return { ...authored, percentages: live.percentages, basis: "live_community", isSynthetic: false };
}
