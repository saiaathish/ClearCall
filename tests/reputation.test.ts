import { describe, expect, it, vi } from "vitest";
import { computeReputationScore, persistReputationScore } from "@/lib/reputation";

/** Minimal chainable Supabase query builder mock, mirroring tests/storage.test.ts. */
function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.update = vi.fn(chain);
  builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

function makeSupabaseMock(tableResults: Record<string, { data: unknown; error: unknown }>) {
  return {
    from: vi.fn((table: string) =>
      makeQueryBuilder(tableResults[table] ?? { data: null, error: null }),
    ),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("computeReputationScore", () => {
  it("returns zero for a user with no history", async () => {
    const supabase = makeSupabaseMock({
      user_answers: { data: [], error: null },
      discussion_responses: { data: [], error: null },
    });

    const result = await computeReputationScore(supabase, "user-1");
    expect(result.score).toBe(0);
    expect(result.accuracy).toBe(0);
    expect(result.citationCount).toBe(0);
    expect(result.helpfulAnswers).toBe(0);
  });

  it("rewards agreement with the recommended decision, citations, and helpful votes", async () => {
    const supabase = makeSupabaseMock({
      user_answers: {
        data: [
          {
            case_id: "sfp-controlled-lunge",
            selected_option_id: "direct-free-kick-yellow",
            confidence: 90,
            selected_factor_keys: ["control"],
            answered_at: "2026-07-10T00:00:00.000Z",
          },
        ],
        error: null,
      },
      discussion_responses: {
        data: [
          { rule_citation: "Law 12", body: "A".repeat(250), helpful_count: 10 },
        ],
        error: null,
      },
    });

    const result = await computeReputationScore(supabase, "user-1");
    expect(result.accuracy).toBe(100);
    expect(result.citationCount).toBe(1);
    expect(result.helpfulAnswers).toBe(10);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("ignores answers for case ids not in the static catalog", async () => {
    const supabase = makeSupabaseMock({
      user_answers: {
        data: [
          {
            case_id: "unknown-case",
            selected_option_id: "whatever",
            confidence: 50,
            selected_factor_keys: [],
            answered_at: "2026-07-10T00:00:00.000Z",
          },
        ],
        error: null,
      },
      discussion_responses: { data: [], error: null },
    });

    const result = await computeReputationScore(supabase, "user-1");
    expect(result.accuracy).toBe(0);
  });
});

describe("persistReputationScore", () => {
  it("delegates to the authoritative recompute_reputation RPC instead of writing protected columns directly", async () => {
    const supabase = makeSupabaseMock({});

    await persistReputationScore(supabase);
    expect(supabase.rpc).toHaveBeenCalledWith("recompute_reputation");
    // Must NOT write protected profile metrics from the client.
    expect(supabase.from).not.toHaveBeenCalledWith("profiles");
  });
});
