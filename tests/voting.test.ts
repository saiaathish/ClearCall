import { describe, expect, it, vi } from "vitest";
import { fetchLiveDistribution } from "@/lib/voting";

function makeSupabaseMock(rpcResult: { data: unknown; error: unknown }) {
  return {
    rpc: vi.fn(() => Promise.resolve(rpcResult)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("fetchLiveDistribution", () => {
  it("splits community and verified breakdowns from the RPC rows", async () => {
    const supabase = makeSupabaseMock({
      data: [
        { selected_option_id: "red", role: "learner", vote_count: 5 },
        { selected_option_id: "red", role: "verified_referee", vote_count: 8 },
        { selected_option_id: "yellow", role: "learner", vote_count: 3 },
        { selected_option_id: "yellow", role: "verified_referee", vote_count: 2 },
      ],
      error: null,
    });

    const result = await fetchLiveDistribution(supabase, "case-a", ["red", "yellow"]);

    expect(result.community).not.toBeNull();
    expect(result.community?.totalVotes).toBe(18);
    expect(result.community?.percentages.red).toBe(72);
    expect(result.community?.percentages.yellow).toBe(28);

    expect(result.verified).not.toBeNull();
    expect(result.verified?.totalVotes).toBe(10);
    expect(result.verified?.percentages.red).toBe(80);
    expect(result.verified?.percentages.yellow).toBe(20);
  });

  it("returns null breakdowns when there are zero votes", async () => {
    const supabase = makeSupabaseMock({ data: [], error: null });
    const result = await fetchLiveDistribution(supabase, "case-a", ["red", "yellow"]);
    expect(result.community).toBeNull();
    expect(result.verified).toBeNull();
  });

  it("returns null breakdowns on RPC error", async () => {
    const supabase = makeSupabaseMock({ data: null, error: new Error("rpc failed") });
    const result = await fetchLiveDistribution(supabase, "case-a", ["red", "yellow"]);
    expect(result.community).toBeNull();
    expect(result.verified).toBeNull();
  });
});
