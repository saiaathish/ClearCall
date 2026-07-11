"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CircleAlert,
  Gauge,
  Target,
  X,
} from "lucide-react";
import { cases } from "@/data/cases";
import { deriveLearnerProfile, rankPersonalizedCases } from "@/lib/algorithms";
import { useDemo } from "@/context/demo-context";
import { CaseCard } from "@/components/case-card";

export function FeedView() {
  const {
    answers,
    savedCaseIds,
    currentStreak,
    hydrated,
    onboardingComplete,
    completeOnboarding,
  } = useDemo();
  const [index, setIndex] = useState(0);
  const [activeCaseId, setActiveCaseId] = useState("");
  const answerList = useMemo(() => Object.values(answers), [answers]);
  const ranked = useMemo(
    () => rankPersonalizedCases(cases, answerList),
    [answerList],
  );
  const displayCases = ranked.length ? ranked.map((entry) => entry.case) : [...cases];
  const safeIndex = index % displayCases.length;
  const scenario = cases.find((item) => item.id === activeCaseId) ?? displayCases[safeIndex];
  const visiblePosition = displayCases.findIndex((item) => item.id === scenario.id);
  const profile = useMemo(
    () =>
      deriveLearnerProfile(answerList, cases, {
        savedCaseIds,
        currentStreak,
      }),
    [answerList, currentStreak, savedCaseIds],
  );
  const completion = Math.round((answerList.length / cases.length) * 100);

  const moveFeed = (direction: -1 | 1) => {
    const currentPosition = displayCases.findIndex((item) => item.id === scenario.id);
    const nextPosition =
      currentPosition === -1
        ? direction === 1
          ? 0
          : displayCases.length - 1
        : (currentPosition + direction + displayCases.length) % displayCases.length;
    setIndex(nextPosition);
    setActiveCaseId(displayCases[nextPosition].id);
  };

  if (!hydrated) {
    return (
      <div className="feed-page" aria-label="Loading your training feed">
        <div className="feed-layout">
          <div className="loading-skeleton" style={{ minHeight: 760 }} />
          <div className="loading-skeleton" style={{ minHeight: 260 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <header className="feed-intro">
        <div>
          <h1>Make the call</h1>
          <p>Watch → decide → explain. Evidence stays hidden until you commit.</p>
        </div>
        <div className="feed-progress" aria-label={`${answerList.length} of ${cases.length} cases completed`}>
          <span>{answerList.length}/{cases.length} reviewed</span>
          <span className="feed-progress__track" aria-hidden="true">
            <span style={{ width: `${completion}%` }} />
          </span>
        </div>
      </header>

      {!onboardingComplete && (
        <section className="onboarding-strip" aria-labelledby="onboarding-title">
          <span className="onboarding-strip__icon" aria-hidden="true"><Target size={18} /></span>
          <div>
            <strong id="onboarding-title">Train your judgment, not just your rulebook.</strong>
            <p>Choose a decision, set your confidence, and name the factors before revealing the authored teaching rationale.</p>
          </div>
          <button className="button button--secondary" type="button" onClick={completeOnboarding}>
            Start training
          </button>
          <button className="icon-button icon-button--small" type="button" onClick={completeOnboarding} aria-label="Dismiss introduction">
            <X aria-hidden="true" size={16} />
          </button>
        </section>
      )}

      <div className="feed-layout">
        <div className="feed-stage">
          <CaseCard key={scenario.id} scenario={scenario} onSubmitted={setActiveCaseId} />
          <div className="feed-nav">
            <button
              className="button button--ghost"
              type="button"
              onClick={() => moveFeed(-1)}
            >
              <ArrowLeft aria-hidden="true" size={16} /> Previous
            </button>
            <span className="feed-nav__count">
              {visiblePosition === -1
                ? `Reviewed · ${displayCases.length} left`
                : `${visiblePosition + 1} / ${displayCases.length}`}
            </span>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => moveFeed(1)}
            >
              Next case <ArrowRight aria-hidden="true" size={16} />
            </button>
          </div>
        </div>

        <aside className="learning-rail" aria-label="Learning context">
          <section className="learning-card">
            <span className="learning-card__label">Current calibration</span>
            <div className="learning-card__metric">
              <strong>{profile.completedCases ? `${profile.calibrationScore}%` : "—"}</strong>
              <span>{profile.calibrationLabel}</span>
            </div>
            <p>
              {profile.completedCases
                ? "Calibration compares your confidence with recommendation alignment."
                : "Complete a case to start measuring confidence calibration."}
            </p>
          </section>
          <section className="learning-card">
            <span className="learning-card__label">Your review loop</span>
            <ol className="learning-path">
              <li data-active><span className="learning-path__step">01</span><span>Watch the incident context</span></li>
              <li data-active><span className="learning-path__step">02</span><span>Decide and explain</span></li>
              <li data-active={Boolean(answers[scenario.id]) || undefined}><span className="learning-path__step">03</span><span>Reveal authored evidence</span></li>
              <li><span className="learning-path__step">04</span><span>Compare the teaching pair</span></li>
            </ol>
          </section>
          <section className="learning-card">
            <span className="learning-card__label">Practice signal</span>
            <div className="learning-card__metric">
              <strong>{profile.weakestCategory ? "1" : "—"}</strong>
              <span>{profile.weakestCategory ?? "Collecting evidence"}</span>
            </div>
            <p>{profile.mostCommonReasoningMistake}</p>
            <Link className="text-link" href="/profile" style={{ marginTop: 13 }}>
              View learner profile <ArrowRight size={13} />
            </Link>
          </section>
          <div className="demo-notice">
            <CircleAlert aria-hidden="true" size={15} />
            <span>All cases, distributions, and reviewer patterns are authored demo material requiring qualified review.</span>
          </div>
          <div className="button-row">
            <Link className="button button--ghost" href="/about">
              <BookOpenCheck aria-hidden="true" size={15} /> Trust model
            </Link>
            <Link className="button button--ghost" href="/profile">
              <Gauge aria-hidden="true" size={15} /> Progress
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
