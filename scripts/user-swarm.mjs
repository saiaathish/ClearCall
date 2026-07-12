#!/usr/bin/env node
/**
 * ClearCall 100-user swarm — each agent is a persona that browses and interacts.
 * Writes scripts/swarm-report.json
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.CLEARCALL_BASE || "http://127.0.0.1:3000";
const AGENTS = Number(process.env.SWARM_COUNT || 100);
const CONCURRENCY = Number(process.env.SWARM_CONCURRENCY || 8);

const SEED_CASES = [
  "sfp-controlled-lunge",
  "sfp-high-contact-lunge",
  "handball-supporting-arm",
  "handball-raised-arm",
  "offside-line-of-vision",
  "offside-no-impact",
  "dogso-central-breakaway",
  "advantage-quick-breakdown",
  "simulation-initiated-contact",
  "goalkeeper-deliberate-kick",
];

const PERSONAS = [
  { name: "curious-newcomer", journey: "feed-browse" },
  { name: "decisive-ref", journey: "full-decision" },
  { name: "comparer", journey: "compare" },
  { name: "saver", journey: "save-flow" },
  { name: "publisher", journey: "publish-peek" },
  { name: "profiler", journey: "profile" },
  { name: "skeptic", journey: "about-trust" },
  { name: "guest-blocked", journey: "guest-auth" },
  { name: "filter-surfer", journey: "foul-filter" },
  { name: "discussion-reader", journey: "case-deep" },
];

function personaFor(i) {
  const p = PERSONAS[i % PERSONAS.length];
  return {
    id: i + 1,
    label: `${p.name}-${i + 1}`,
    journey: p.journey,
    caseId: SEED_CASES[i % SEED_CASES.length],
  };
}

async function waitHydrated(page) {
  await page.waitForTimeout(400);
  try {
    await page.waitForFunction(
      () => !document.querySelector('[aria-label="Loading the case feed"]'),
      { timeout: 8000 },
    );
  } catch {
    /* may not be on feed */
  }
}

async function enterDemo(page) {
  await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded", timeout: 30000 });
  const btn = page.getByRole("button", { name: "Continue with Jordan Lee demo" });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForURL(/\/$/, { timeout: 10000 }).catch(() => {});
  }
}

async function clearToGuest(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("clearcall-demo-session", "0");
    localStorage.removeItem("clearcall-demo-v1");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
}

async function runJourney(context, agent) {
  const page = await context.newPage();
  const findings = [];
  const errors = [];
  const consoleErrors = [];
  const started = Date.now();

  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 200));
  });

  const note = (msg) => findings.push(msg);

  try {
    switch (agent.journey) {
      case "feed-browse": {
        await enterDemo(page);
        await page.goto(BASE, { waitUntil: "networkidle", timeout: 45000 }).catch(() =>
          page.goto(BASE, { waitUntil: "domcontentloaded" }),
        );
        await waitHydrated(page);
        const feed = page.getByRole("list", { name: "Officiating case feed" });
        const hasFeed = await feed.isVisible().catch(() => false);
        const makeCall = page.getByRole("link", { name: /Make your call|Review your call/ });
        const callCount = await makeCall.count();
        note(`feed_visible=${hasFeed} call_links=${callCount}`);
        if (callCount === 0) {
          const body = await page.locator("main").innerText().catch(() => "");
          note(`feed_empty_main_snip=${body.slice(0, 180).replace(/\s+/g, " ")}`);
        }
        await page.mouse.wheel(0, 1200);
        await page.waitForTimeout(500);
        note(`scrolled; call_links_after=${await makeCall.count()}`);
        break;
      }
      case "full-decision": {
        await enterDemo(page);
        await page.goto(`${BASE}/case/${agent.caseId}`, { waitUntil: "domcontentloaded" });
        await waitHydrated(page);
        const title = await page.locator("h1").first().innerText().catch(() => "");
        note(`case_title=${title.slice(0, 80)}`);
        const radios = page.getByRole("radio");
        const radioCount = await radios.count();
        note(`decision_radios=${radioCount}`);
        if (radioCount > 0) {
          await radios.nth(agent.id % Math.min(radioCount, 4)).click({ force: true });
          const checks = page.getByRole("checkbox");
          const c = await checks.count();
          if (c > 0) await checks.nth(0).click({ force: true });
          const reveal = page.getByRole("button", { name: /Reveal the evidence|Update your call/ });
          if (await reveal.isVisible().catch(() => false)) {
            await reveal.click();
            await page.waitForTimeout(800);
            note("submitted_decision");
            const compare = page.getByRole("link", { name: /Compare match vs expert/ });
            note(`compare_link=${await compare.isVisible().catch(() => false)}`);
          } else {
            note("reveal_button_missing_or_already_current");
          }
        } else {
          note("no_radios_maybe_already_answered");
          const update = page.getByRole("button", { name: /Update your call|Call is current|Reveal/ });
          note(`post_answer_ui=${await update.count()}`);
        }
        break;
      }
      case "compare": {
        await enterDemo(page);
        await page.goto(`${BASE}/compare?case=${agent.caseId}`, { waitUntil: "domcontentloaded" });
        await waitHydrated(page);
        const h1 = await page.locator("h1").first().innerText().catch(() => "");
        note(`compare_h1=${h1.slice(0, 100)}`);
        const picker = page.locator("#compare-case");
        note(`case_picker=${await picker.isVisible().catch(() => false)}`);
        const body = await page.locator("main").innerText().catch(() => "");
        note(`has_similarity=${/similar/i.test(body)}`);
        note(`main_snip=${body.slice(0, 160).replace(/\s+/g, " ")}`);
        break;
      }
      case "save-flow": {
        await enterDemo(page);
        await page.goto(`${BASE}/case/${agent.caseId}`, { waitUntil: "domcontentloaded" });
        await waitHydrated(page);
        const save = page.getByRole("button", { name: /Save case|Saved|Remove case from saved/ }).first();
        if (await save.isVisible().catch(() => false)) {
          const before = await save.getAttribute("aria-label");
          await save.click();
          await page.waitForTimeout(400);
          note(`save_toggled from=${before}`);
        } else note("save_button_missing");
        await page.goto(`${BASE}/saved`, { waitUntil: "domcontentloaded" });
        await waitHydrated(page);
        const cards = await page.getByRole("link", { name: /Continue training/ }).count();
        note(`saved_continue_links=${cards}`);
        break;
      }
      case "publish-peek": {
        await enterDemo(page);
        await page.goto(`${BASE}/publish`, { waitUntil: "domcontentloaded" });
        await waitHydrated(page);
        const badge = await page.getByText("Local demo only").isVisible().catch(() => false);
        const submit = page.getByRole("button", { name: "Submit for review" });
        note(`local_demo_badge=${badge} submit_visible=${await submit.isVisible().catch(() => false)}`);
        break;
      }
      case "profile": {
        await enterDemo(page);
        await page.goto(`${BASE}/profile`, { waitUntil: "domcontentloaded" });
        await waitHydrated(page);
        const main = await page.locator("main").innerText().catch(() => "");
        note(`profile_snip=${main.slice(0, 220).replace(/\s+/g, " ")}`);
        note(`has_reset=${/Reset demo data/i.test(main)}`);
        note(`has_calibration=${/calibrat|Brier|alignment|accuracy|streak/i.test(main)}`);
        break;
      }
      case "about-trust": {
        await page.goto(`${BASE}/about`, { waitUntil: "domcontentloaded" });
        const about = await page.locator("main").innerText().catch(() => "");
        note(`about_len=${about.length}`);
        note(`mentions_demo=${/demo|synthetic|disclaimer/i.test(about)}`);
        await page.goto(`${BASE}/trust`, { waitUntil: "domcontentloaded" });
        note(`trust_ok=${page.url().includes("trust") || page.url().includes("about")}`);
        break;
      }
      case "guest-auth": {
        await clearToGuest(page);
        await page.goto(`${BASE}/case/dogso-central-breakaway`, { waitUntil: "domcontentloaded" });
        await waitHydrated(page);
        const radios = page.getByRole("radio");
        if ((await radios.count()) > 0) {
          await radios.nth(0).click({ force: true });
          const checks = page.getByRole("checkbox");
          if ((await checks.count()) > 0) await checks.nth(0).click({ force: true });
          const reveal = page.getByRole("button", { name: "Reveal the evidence" });
          if (await reveal.isVisible().catch(() => false)) {
            await reveal.click();
            await page.waitForTimeout(1000);
          }
        }
        note(`after_guest_submit_url=${page.url()}`);
        note(`landed_auth=${page.url().includes("/auth")}`);
        break;
      }
      case "foul-filter": {
        await enterDemo(page);
        const cats = [
          "Serious foul play",
          "Handball",
          "Offside interference",
          "DOGSO",
          "Advantage",
          "Simulation",
        ];
        const cat = cats[agent.id % cats.length];
        await page.goto(`${BASE}/?foul=${encodeURIComponent(cat)}`, {
          waitUntil: "domcontentloaded",
        });
        await waitHydrated(page);
        const links = await page.getByRole("link", { name: /Make your call|Review your call/ }).count();
        note(`filter=${cat} results=${links}`);
        break;
      }
      case "case-deep":
      default: {
        await enterDemo(page);
        await page.goto(`${BASE}/case/${agent.caseId}`, { waitUntil: "domcontentloaded" });
        await waitHydrated(page);
        const main = await page.locator("main").innerText().catch(() => "");
        note(`discussion=${/discussion|comment/i.test(main)}`);
        note(`similar=${/similar/i.test(main)}`);
        note(`distribution=${/distribution|community|learner|verified/i.test(main)}`);
        note(`disclaimer=${/Demo review|demo/i.test(main)}`);
        await page.getByRole("link", { name: "Back to feed" }).click().catch(() => {});
        note(`nav_back=${page.url()}`);
        break;
      }
    }

    // Shared nav smoke for every agent
    for (const path of ["/", "/compare", "/saved", "/profile"]) {
      const res = await page.goto(`${BASE}${path}`, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });
      note(`nav_${path}_status=${res?.status()}`);
    }
  } catch (e) {
    errors.push(String(e.message || e).slice(0, 300));
  } finally {
    await page.close().catch(() => {});
  }

  return {
    agent: agent.label,
    journey: agent.journey,
    caseId: agent.caseId,
    ms: Date.now() - started,
    findings,
    errors,
    consoleErrors: consoleErrors.slice(0, 5),
    ok: errors.length === 0,
  };
}

async function pool(items, limit, fn) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function main() {
  const agents = Array.from({ length: AGENTS }, (_, i) => personaFor(i));
  console.log(`Starting ${AGENTS} agents against ${BASE} (concurrency ${CONCURRENCY})`);

  const browser = await chromium.launch({ headless: true });
  const results = await pool(agents, CONCURRENCY, async (agent) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: `ClearCallSwarm/${agent.label}`,
    });
    try {
      const r = await runJourney(context, agent);
      process.stdout.write(r.ok ? "." : "x");
      return r;
    } finally {
      await context.close();
    }
  });
  await browser.close();
  console.log("\nDone.");

  const failed = results.filter((r) => !r.ok);
  const byJourney = {};
  for (const r of results) {
    byJourney[r.journey] ??= { count: 0, fails: 0, findings: [] };
    byJourney[r.journey].count++;
    if (!r.ok) byJourney[r.journey].fails++;
    byJourney[r.journey].findings.push(...r.findings);
  }

  // Aggregate signal phrases
  const signals = {};
  for (const r of results) {
    for (const f of r.findings) {
      const key = f.split("=")[0];
      signals[key] ??= { samples: [], count: 0 };
      signals[key].count++;
      if (signals[key].samples.length < 8) signals[key].samples.push(f);
    }
  }

  const report = {
    base: BASE,
    agents: AGENTS,
    concurrency: CONCURRENCY,
    completedAt: new Date().toISOString(),
    summary: {
      ok: results.filter((r) => r.ok).length,
      failed: failed.length,
      avgMs: Math.round(results.reduce((a, r) => a + r.ms, 0) / results.length),
    },
    byJourney,
    signals,
    failures: failed.slice(0, 25),
    sampleOk: results.filter((r) => r.ok).slice(0, 15),
    all: results,
  };

  const out = join(__dirname, "swarm-report.json");
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`Wrote ${out}`);
  console.log(JSON.stringify(report.summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
