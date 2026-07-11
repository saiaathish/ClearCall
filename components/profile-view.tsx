"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CircleAlert,
  Gauge,
  RotateCcw,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { cases } from "@/data/cases";
import { deriveLearnerProfile } from "@/lib/algorithms";
import type { OfficiatingCase, UserAnswer } from "@/lib/types";
import { useDemo } from "@/context/demo-context";
import { useToast } from "@/components/toast-provider";

function answerMatches(answer: UserAnswer, scenario?: OfficiatingCase) {
  return Boolean(scenario && answer.selectedOptionId === scenario.recommendedDecision);
}

function makeTrend(answers: readonly UserAnswer[]) {
  const ordered = [...answers].sort((a, b) => a.answeredAt.localeCompare(b.answeredAt)).slice(-7);
  let aligned = 0;
  return ordered.map((answer, index) => {
    const scenario = cases.find((item) => item.id === answer.caseId);
    if (answerMatches(answer, scenario)) aligned += 1;
    return Math.round((aligned / (index + 1)) * 100);
  });
}

function trendPath(values: readonly number[]) {
  if (values.length === 0) return "";
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
      const y = 62 - (value / 100) * 54;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

export function ProfileView() {
  const { answers, savedCaseIds, currentStreak, hydrated, resetDemo } = useDemo();
  const { showToast } = useToast();
  const answerList = useMemo(() => Object.values(answers), [answers]);
  const profile = useMemo(
    () => deriveLearnerProfile(answerList, cases, { savedCaseIds, currentStreak }),
    [answerList, currentStreak, savedCaseIds],
  );
  const recommended = cases.find((item) => item.id === profile.recommendedCaseId);
  const trend = makeTrend(answerList);
  const recentActivity = [...answerList].sort((a, b) => b.answeredAt.localeCompare(a.answeredAt)).slice(0, 5);

  const reset = () => {
    if (!window.confirm("Reset answers, saves, comments, and local drafts to the seeded Jordan Lee demo?")) return;
    resetDemo();
    showToast("Demo data restored to the seeded baseline.", "success");
  };

  if (!hydrated) {
    return <div className="page-shell"><div className="loading-skeleton" style={{ minHeight: 720 }} aria-label="Loading learner profile" /></div>;
  }

  return (
    <div className="page-shell">
      <header className="profile-banner">
        <span className="profile-avatar" aria-hidden="true">{profile.avatarInitials}</span>
        <div>
          <p className="eyebrow">Learner profile</p>
          <h1>{profile.displayName}</h1>
          <p>Referee learner · {profile.currentLevel} level · local demonstration profile</p>
        </div>
        <div className="profile-summary">
          <span className="profile-summary__item"><strong>{profile.currentStreak}</strong><span>Practice streak</span></span>
          <span className="profile-summary__item"><strong>{profile.completedCases}</strong><span>Completed</span></span>
          <span className="profile-summary__item"><strong>{profile.savedCases}</strong><span>Saved</span></span>
        </div>
      </header>

      <section className="metric-grid" aria-label="Primary learning metrics">
        <MetricCard label="Demo alignment" value={`${profile.overallAccuracy}%`} detail="Matches with authored recommendations" icon={Target} accent />
        <MetricCard label="Calibration" value={`${profile.calibrationScore}%`} detail={profile.calibrationLabel} icon={Gauge} />
        <MetricCard label="High-confidence errors" value={String(profile.highConfidenceErrors)} detail="Mismatches submitted at 80%+" icon={TriangleAlert} />
        <MetricCard
          label="Recent improvement"
          value={profile.recentImprovement === null ? "—" : `${profile.recentImprovement >= 0 ? "+" : ""}${profile.recentImprovement}pt`}
          detail={profile.recentImprovement === null ? "Complete more cases for a trend" : "Recent vs previous answer window"}
          icon={TrendingUp}
        />
      </section>

      <div className="profile-grid">
        <div className="profile-column">
          <section className="content-section" aria-labelledby="category-performance-heading">
            <div className="content-section__header">
              <div><h2 className="section-title" id="category-performance-heading">Category performance</h2><p className="section-description">Recommendation alignment by incident family; “—” means no evidence yet.</p></div>
            </div>
            <div className="category-bars">
              {profile.categoryAccuracy.map((category) => (
                <div className="category-bar" key={category.key}>
                  <span>{category.label}</span>
                  <span className="category-bar__track" aria-hidden="true"><span style={{ width: `${category.accuracy ?? 0}%` }} /></span>
                  <strong>{category.accuracy === null ? "—" : `${category.accuracy}%`}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="content-section" aria-labelledby="difficulty-performance-heading">
            <div className="content-section__header">
              <div><h2 className="section-title" id="difficulty-performance-heading">Difficulty alignment</h2><p className="section-description">Authored-demo recommendation alignment by case difficulty; “—” means no evidence yet.</p></div>
            </div>
            <div className="category-bars">
              {profile.difficultyAccuracy.map((difficulty) => (
                <div className="category-bar" key={difficulty.key}>
                  <span>{difficulty.label.charAt(0).toUpperCase() + difficulty.label.slice(1)}</span>
                  <span className="category-bar__track" aria-hidden="true"><span style={{ width: `${difficulty.accuracy ?? 0}%` }} /></span>
                  <strong>{difficulty.accuracy === null ? "—" : `${difficulty.accuracy}%`}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="content-section" aria-labelledby="calibration-heading">
            <div className="content-section__header">
              <div><h2 className="section-title" id="calibration-heading">Confidence vs. alignment</h2><p className="section-description">Lime shows observed recommendation alignment; amber markers represent the confidence band.</p></div>
            </div>
            <CalibrationPlot answers={answerList} />
            <div className="demo-notice" style={{ marginTop: 15 }}>
              <CircleAlert aria-hidden="true" size={15} />
              <span>Calibration uses the brief’s Brier-loss formula. Because these are open-discussion demos, the score measures alignment with the authored recommendation—not official correctness.</span>
            </div>
          </section>

          <section className="content-section" aria-labelledby="trend-heading">
            <div className="content-section__header">
              <div><h2 className="section-title" id="trend-heading">Recent performance</h2><p className="section-description">Cumulative authored-recommendation alignment across up to seven recent sessions.</p></div>
            </div>
            {trend.length ? (
              <svg className="trend-chart" viewBox="0 0 100 68" role="img" aria-label={`Recent alignment trend ending at ${trend.at(-1)} percent`}>
                <line className="trend-chart__grid" x1="0" y1="8" x2="100" y2="8" />
                <line className="trend-chart__grid" x1="0" y1="35" x2="100" y2="35" />
                <line className="trend-chart__grid" x1="0" y1="62" x2="100" y2="62" />
                <path className="trend-chart__area" d={`${trendPath(trend)} L100,62 L0,62 Z`} />
                <path className="trend-chart__line" d={trendPath(trend)} />
              </svg>
            ) : <p className="muted">Complete a case to start the trend.</p>}
          </section>
        </div>

        <aside className="profile-column" aria-label="Learning insights">
          <section className="insight-card">
            <span className="insight-card__label"><BrainCircuit aria-hidden="true" size={14} /> Reasoning pattern</span>
            <h3>{profile.mostCommonReasoningMistake}</h3>
            <p>Use the next recommendation to isolate that factor against a similar-looking scenario.</p>
          </section>

          <section className="content-section">
            <div className="content-section__header">
              <div><h2 className="section-title">Learning edges</h2><p className="section-description">Areas inferred from locally stored answers.</p></div>
            </div>
            <div className="summary-stat" style={{ marginBottom: 9 }}><span>Weakest category</span><strong>{profile.weakestCategory ?? "Not enough data"}</strong></div>
            <div className="summary-stat"><span>Strongest category</span><strong>{profile.strongestCategory ?? "Not enough data"}</strong></div>
          </section>

          {recommended && (
            <section className="content-section">
              <span className="pinned-label"><Sparkles aria-hidden="true" size={13} /> Recommended next</span>
              <h2 className="section-title" style={{ marginTop: 14 }}>{recommended.title}</h2>
              <p className="section-description">Selected from your weakest observed category and current difficulty fit.</p>
              <div className="meta-row" style={{ marginTop: 12 }}><span className="meta-chip">{recommended.category}</span><span className="meta-chip">{recommended.difficulty}</span></div>
              <Link className="button button--wide" href={`/case/${recommended.id}`} style={{ marginTop: 15 }}>Train this case <ArrowRight size={15} /></Link>
            </section>
          )}

          <section className="content-section" aria-labelledby="activity-heading">
            <div className="content-section__header"><div><h2 className="section-title" id="activity-heading">Recent activity</h2></div></div>
            <ul className="activity-list">
              {recentActivity.map((answer) => {
                const scenario = cases.find((item) => item.id === answer.caseId);
                const aligned = answerMatches(answer, scenario);
                return (
                  <li key={answer.caseId}>
                    <span className={`activity-dot ${aligned ? "activity-dot--correct" : "activity-dot--incorrect"}`} aria-hidden="true" />
                    <span><strong>{scenario?.title ?? answer.caseId}</strong><span>{aligned ? "Aligned" : "Different interpretation"} · {answer.confidence}% confidence</span></span>
                    <time dateTime={answer.answeredAt}>{new Date(answer.answeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time>
                  </li>
                );
              })}
            </ul>
          </section>

          <details className="settings-panel">
            <summary><Settings aria-hidden="true" size={16} /> Profile settings</summary>
            <div className="settings-panel__body">
              <p>Reset all browser-local answers, saves, comments, and drafts to Jordan Lee’s seeded demonstration baseline.</p>
              <button className="button button--danger button--wide" type="button" onClick={reset}><RotateCcw aria-hidden="true" size={15} /> Reset demo data</button>
            </div>
          </details>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Target;
  accent?: boolean;
}) {
  return (
    <article className={`metric-card ${accent ? "metric-card--accent" : ""}`}>
      <div className="metric-card__topline"><span>{label}</span><Icon aria-hidden="true" size={16} /></div>
      <strong className="metric-card__value">{value}</strong>
      <p className="metric-card__detail">{detail}</p>
    </article>
  );
}

function CalibrationPlot({ answers }: { answers: readonly UserAnswer[] }) {
  const buckets = [50, 60, 70, 80, 90, 100].map((floor, index) => {
    const ceiling = index === 5 ? 101 : floor + 10;
    const matching = answers.filter((answer) => answer.confidence >= floor && answer.confidence < ceiling);
    const aligned = matching.filter((answer) => answerMatches(answer, cases.find((item) => item.id === answer.caseId))).length;
    return { floor, accuracy: matching.length ? Math.round((aligned / matching.length) * 100) : 0, count: matching.length };
  });

  return (
    <div className="calibration-plot" aria-label="Confidence band alignment chart">
      {buckets.map((bucket) => (
        <div className="calibration-column" key={bucket.floor} title={`${bucket.floor}% band: ${bucket.count} answer${bucket.count === 1 ? "" : "s"}, ${bucket.accuracy}% alignment`}>
          <span className="calibration-column__bar" style={{ height: `${Math.max(3, bucket.accuracy)}%` }}>
            <span className="calibration-column__marker" style={{ bottom: `${bucket.floor}%` }} />
          </span>
          <span>{bucket.floor}</span>
        </div>
      ))}
    </div>
  );
}
