import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 50 * 1024 * 1024;
const MIME_TYPES = new Set(["video/mp4", "video/webm", "image/jpeg", "image/png", "image/webp"]);

/** Maps the 0-1 numeric difficulty to the legacy text bucket the cases table stores. */
function difficultyLabel(score: number): string {
  if (score <= 0.34) return "beginner";
  if (score >= 0.7) return "advanced";
  return "intermediate";
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // 1-2. Authenticate; the creator id is derived from the session, never trusted from the body.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const form = await request.formData();
  const text = (key: string) => String(form.get(key) ?? "").trim();

  // 3-4. Accept and validate the required case payload.
  const sport = text("sport");
  const incident = text("incident");
  const category = text("rule category") || text("category");
  const decision = text("original decision") || text("originalDecision");
  const description = text("description") || incident;

  let options: unknown;
  try {
    options = JSON.parse(text("options"));
  } catch {
    options = form.getAll("options").map(String);
  }

  if (!sport || !incident || !category || !decision || !Array.isArray(options) || options.length === 0) {
    return NextResponse.json({ error: "Invalid case payload" }, { status: 400 });
  }

  const rawDifficulty = Number(form.get("difficulty") ?? 0.5);
  const difficulty = Number.isFinite(rawDifficulty) ? Math.min(1, Math.max(0, rawDifficulty)) : 0.5;

  // 5-8. Optional clip: validate MIME + size server-side, upload under the user's own prefix.
  const clip = form.get("clip");
  let videoUrl: string | null = null;
  if (clip instanceof File && clip.size > 0) {
    if (!MIME_TYPES.has(clip.type) || clip.size > MAX_BYTES) {
      return NextResponse.json({ error: "Unsupported clip" }, { status: 400 });
    }
    const path = `${user.id}/${crypto.randomUUID()}-${clip.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const upload = await supabase.storage.from("case-media").upload(path, clip, { upsert: false });
    if (upload.error) return NextResponse.json({ error: "Media upload failed" }, { status: 502 });
    videoUrl = path;
  }

  // 9. Collision-resistant, production-compatible text id (cases.id is text).
  const id = crypto.randomUUID();
  const slug = `${slugify(incident) || "case"}-${id.slice(0, 8)}`;

  // 10-11. Insert into canonical relational columns; keep a legacy data jsonb for
  // backward compatibility with readers that still consume the blob shape.
  const legacyData = {
    id, slug, sport, category, title: incident, prompt: incident, description,
    originalDecision: decision, difficulty: difficultyLabel(difficulty),
    answerOptions: options, factors: [], scenarioStatus: "OPEN_DISCUSSION",
    sourceType: "user-published", isDemo: false, videoSrc: videoUrl,
  };

  const casesTable = supabase.from("cases") as unknown as {
    insert(value: Record<string, unknown>): {
      select(columns: string): { single(): Promise<{ data: unknown; error: unknown }> };
    };
  };

  const { data, error } = await casesTable
    .insert({
      id,
      slug,
      creator_id: user.id,
      sport,
      incident,
      category,
      difficulty: difficultyLabel(difficulty),
      difficulty_score: difficulty,
      scenario_status: "OPEN_DISCUSSION",
      is_demo: false,
      status: "active",
      video_url: videoUrl,
      description,
      official_decision: decision,
      recommended_decision: null,
      options,
      factors: [],
      data: legacyData,
    })
    .select("*")
    .single();

  // 14. Roll back the uploaded media if the row insert fails.
  if (error || !data) {
    if (videoUrl) await supabase.storage.from("case-media").remove([videoUrl]);
    return NextResponse.json({ error: "Case creation failed" }, { status: 500 });
  }

  // 12-13. Return the inserted case with HTTP 201.
  return NextResponse.json({ case: data }, { status: 201 });
}
