import { describe, expect, it } from "vitest";
import { validateCases, sanitizePublicText, filterValidDemoCases } from "@/data/validate-cases";
import { cases } from "@/data/cases";
import type { OfficiatingCase } from "@/lib/types";

describe("case content validation", () => {
  it("sanitizes bracketed case ids and generation markers", () => {
    expect(sanitizePublicText("Nice read [sfp-side-tackle-ankle] here", "sfp-side-tackle-ankle")).not.toContain(
      "[sfp-side-tackle-ankle]",
    );
    expect(sanitizePublicText("ok take (gen-advantage-026:1)", "gen-advantage-026")).not.toMatch(/gen-advantage/);
    expect(sanitizePublicText("On screen: A ball. Call it as a handball look off this clip.")).not.toMatch(
      /on screen:|call it as|look off this/i,
    );
  });

  it("flags broken template language in a synthetic case", () => {
    const broken = {
      ...cases[0]!,
      id: "broken-demo",
      title: "Should you this clip caution after advantage?",
      description: "Call it as a serious foul play look off this still.",
      seededDiscussion: cases[0]!.seededDiscussion.map((item, index) =>
        index === 0
          ? { ...item, body: "ok the clip shows a duel. once you see that the rest is noise. [broken-demo]" }
          : item,
      ),
    } satisfies OfficiatingCase;

    const issues = validateCases([broken]);
    expect(issues.some((issue) => issue.message.includes("broken generated"))).toBe(true);
  });

  it("omits hard-failing cases in production-safe filter mode", () => {
    const broken = {
      ...cases[0]!,
      id: "broken-filter",
      description: "Call it as a advantage look off this clip.",
    } satisfies OfficiatingCase;

    const filtered = filterValidDemoCases([cases[0]!, broken], { log: () => undefined });
    expect(filtered.map((item) => item.id)).toEqual([cases[0]!.id]);
  });
});
