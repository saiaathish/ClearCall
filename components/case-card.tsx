"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  GitCompareArrows,
  LockKeyhole,
  ShieldQuestion,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { cases } from "@/data/cases";
import { findTeachingContrast, rankPersonalizedCases } from "@/lib/algorithms";
import type { OfficiatingCase, UserAnswer } from "@/lib/types";
import { useDemo } from "@/context/demo-context";
import { useToast } from "@/components/toast-provider";
import { CaseVideo } from "@/components/case-video";
import { DistributionBars } from "@/components/distribution-bars";
import { SaveButton, ShareButton } from "@/components/case-actions";
import { StatusBadge } from "@/components/status-badge";

function getOptionLabel(scenario: OfficiatingCase, optionId: string) {
  return scenario.answerOptions.find((option) => option.id === optionId)?.label ?? optionId;
}

function formatPublishedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function CaseCard({
  scenario,
  onSubmitted,
}: {
  scenario: OfficiatingCase;
  onSubmitted?: (caseId: string) => void;
}) {
  const { answers, submitAnswer } = useDemo();
  const { showToast } = useToast();
  const submitted = answers[scenario.id];
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [confidence, setConfidence] = useState(70);
  const [selectedFactorKeys, setSelectedFactorKeys] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);
  const firstDecisionRef = useRef<HTMLInputElement>(null);
  const firstFactorRef = useRef<HTMLInputElement>(null);

  const contrast = useMemo(
    () => findTeachingContrast(scenario, cases.filter((item) => item.id !== scenario.id)),
    [scenario],
  );
  const nextRanked = useMemo(
    () =>
      rankPersonalizedCases(cases, Object.values(answers), {
        excludeCaseIds: [scenario.id],
      })[0],
    [answers, scenario.id],
  );

  const handleFactor = (key: string, checked: boolean) => {
    setSelectedFactorKeys((current) =>
      checked ? [...new Set([...current, key])] : current.filter((item) => item !== key),
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitted) return;
    setAttempted(true);
    if (!selectedOptionId || selectedFactorKeys.length === 0) {
      requestAnimationFrame(() => {
        if (!selectedOptionId) firstDecisionRef.current?.focus();
        else firstFactorRef.current?.focus();
      });
      return;
    }

    const answer: UserAnswer = {
      caseId: scenario.id,
      selectedOptionId,
      confidence,
      selectedFactorKeys,
      answeredAt: new Date().toISOString(),
    };
    onSubmitted?.(scenario.id);
    submitAnswer(answer);
    showToast("Call submitted. The evidence is now revealed.", "success");
  };

  const lockedOption = submitted?.selectedOptionId ?? selectedOptionId;
  const lockedConfidence = submitted?.confidence ?? confidence;
  const lockedFactors = submitted?.selectedFactorKeys ?? selectedFactorKeys;

  return (
    <article className="case-card" aria-labelledby={`case-${scenario.id}-title`}>
      <header className="case-card__header">
        <span className="avatar" aria-hidden="true">
          {scenario.publisher.avatarInitials}
        </span>
        <div className="publisher">
          <div className="publisher__name">
            {scenario.publisher.displayName}
            {scenario.publisher.isVerified && (
              <BadgeCheck className="verified-icon" aria-label="Verified referee" size={15} />
            )}
          </div>
          <div className="publisher__meta">
            {scenario.publisher.organization ?? "Independent contributor"} · {formatPublishedAt(scenario.publishedAt)}
          </div>
        </div>
        <div className="case-card__actions">
          <SaveButton caseId={scenario.id} />
          <ShareButton caseId={scenario.id} />
        </div>
      </header>

      <CaseVideo scenario={scenario} />

      <div className="case-card__body">
        <div className="meta-row">
          <StatusBadge status={scenario.scenarioStatus} />
          <span className="meta-chip">{scenario.difficulty}</span>
          <span className="meta-chip">{scenario.competitionLevel}</span>
        </div>

        <div className="case-prompt">
          <h2 id={`case-${scenario.id}-title`}>{scenario.prompt}</h2>
          <div className="case-prompt__context">
            <span>
              <Clock3 aria-hidden="true" size={13} /> Original call: {scenario.originalDecision}
            </span>
            <span>
              <BookOpen aria-hidden="true" size={13} /> {scenario.ruleset} · {scenario.rulesetVersion}
            </span>
          </div>
        </div>

        <form className="decision-form" onSubmit={handleSubmit} noValidate>
          <fieldset
            aria-describedby={attempted && !selectedOptionId && !submitted ? `decision-${scenario.id}-error` : undefined}
            aria-invalid={attempted && !selectedOptionId && !submitted ? true : undefined}
            className="choice-group"
          >
            <legend>1 · Make your decision</legend>
            <div className="choice-grid">
              {scenario.answerOptions.map((option, index) => (
                <label className="choice-option" key={option.id} title={option.description}>
                  <input
                    aria-describedby={attempted && !selectedOptionId && !submitted ? `decision-${scenario.id}-error` : undefined}
                    aria-invalid={attempted && !selectedOptionId && !submitted ? true : undefined}
                    className="sr-only"
                    type="radio"
                    name={`decision-${scenario.id}`}
                    value={option.id}
                    checked={lockedOption === option.id}
                    disabled={Boolean(submitted)}
                    onChange={() => setSelectedOptionId(option.id)}
                    ref={index === 0 ? firstDecisionRef : undefined}
                  />
                  <span className="choice-option__control" aria-hidden="true" />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {attempted && !selectedOptionId && !submitted && (
              <p className="field-error" id={`decision-${scenario.id}-error`} role="alert">
                <CircleAlert aria-hidden="true" size={14} /> Choose one decision before revealing the evidence.
              </p>
            )}
          </fieldset>

          <div className="confidence-row">
            <label htmlFor={`confidence-${scenario.id}`}>2 · Your confidence</label>
            <output className="confidence-value" htmlFor={`confidence-${scenario.id}`}>
              {lockedConfidence}%
            </output>
            <input
              className="range-input"
              id={`confidence-${scenario.id}`}
              type="range"
              min="50"
              max="100"
              step="1"
              value={lockedConfidence}
              disabled={Boolean(submitted)}
              onChange={(event) => setConfidence(Number(event.target.value))}
              style={{ "--range-progress": `${(lockedConfidence - 50) * 2}%` } as CSSProperties}
            />
            <div className="range-labels" aria-hidden="true">
              <span>50% unsure</span>
              <span>100% certain</span>
            </div>
          </div>

          <fieldset
            aria-describedby={attempted && selectedFactorKeys.length === 0 && !submitted ? `factors-${scenario.id}-error` : undefined}
            aria-invalid={attempted && selectedFactorKeys.length === 0 && !submitted ? true : undefined}
            className="factor-group"
          >
            <legend>3 · What influenced your call?</legend>
            <div className="factor-grid">
              {scenario.factors.map((factor, index) => (
                <label className="factor-option" key={factor.key} title={factor.explanation}>
                  <input
                    aria-describedby={attempted && selectedFactorKeys.length === 0 && !submitted ? `factors-${scenario.id}-error` : undefined}
                    aria-invalid={attempted && selectedFactorKeys.length === 0 && !submitted ? true : undefined}
                    className="sr-only"
                    type="checkbox"
                    name={`factor-${scenario.id}`}
                    value={factor.key}
                    checked={lockedFactors.includes(factor.key)}
                    disabled={Boolean(submitted)}
                    onChange={(event) => handleFactor(factor.key, event.target.checked)}
                    ref={index === 0 ? firstFactorRef : undefined}
                  />
                  <span className="factor-check" aria-hidden="true">
                    <Check size={10} />
                  </span>
                  <span>{factor.label}</span>
                </label>
              ))}
            </div>
            {attempted && selectedFactorKeys.length === 0 && !submitted && (
              <p className="field-error" id={`factors-${scenario.id}-error`} role="alert">
                <CircleAlert aria-hidden="true" size={14} /> Select at least one reasoning factor.
              </p>
            )}
          </fieldset>

          <div className="decision-actions">
            <p className="decision-privacy">
              <LockKeyhole aria-hidden="true" size={13} />{
                submitted ? "Submitted response is locked." : "Results stay hidden until you submit."
              }
            </p>
            <button className="button" type="submit" disabled={Boolean(submitted)}>
              {submitted ? (
                <><CheckCircle2 aria-hidden="true" size={16} /> Response locked</>
              ) : (
                <>Reveal the evidence <ArrowRight aria-hidden="true" size={16} /></>
              )}
            </button>
          </div>
        </form>

        {!submitted && (
          <Link className="text-link" href={`/case/${scenario.id}`}>
            Open full case context <ArrowRight aria-hidden="true" size={14} />
          </Link>
        )}
      </div>

      {submitted && (
        <ResultPanel
          scenario={scenario}
          answer={submitted}
          contrast={contrast}
          nextCase={nextRanked?.case}
          nextReason={nextRanked?.reason}
        />
      )}
    </article>
  );
}

function ResultPanel({
  scenario,
  answer,
  contrast,
  nextCase,
  nextReason,
}: {
  scenario: OfficiatingCase;
  answer: UserAnswer;
  contrast: ReturnType<typeof findTeachingContrast>;
  nextCase?: OfficiatingCase;
  nextReason?: string;
}) {
  const aligned = answer.selectedOptionId === scenario.recommendedDecision;
  const openDiscussion = scenario.scenarioStatus === "OPEN_DISCUSSION";
  const expertSupported = scenario.factors.filter((factor) => factor.supportsRecommendation);
  const missed =
    scenario.factors.find(
      (factor) => factor.key === scenario.criticalFactor && !answer.selectedFactorKeys.includes(factor.key),
    ) ?? expertSupported.find((factor) => !answer.selectedFactorKeys.includes(factor.key));

  const verdictClass = openDiscussion
    ? "result-verdict--discussion"
    : aligned
      ? "result-verdict--correct"
      : "result-verdict--incorrect";

  return (
    <section className="result-panel" aria-live="polite" aria-labelledby={`result-${scenario.id}-title`}>
      <div className={`result-verdict ${verdictClass}`}>
        <span className="result-verdict__icon" aria-hidden="true">
          {openDiscussion ? (
            <ShieldQuestion size={21} />
          ) : aligned ? (
            <CheckCircle2 size={21} />
          ) : (
            <XCircle size={21} />
          )}
        </span>
        <div>
          <h3 id={`result-${scenario.id}-title`}>
            {openDiscussion
              ? aligned
                ? "Your call aligns with the demo recommendation"
                : "Your call adds a different interpretation"
              : aligned
                ? "Your call matched the reviewed decision"
                : "This case challenges your weighting"}
          </h3>
          <p>
            {openDiscussion
              ? "This is authored open-discussion material, not an official correctness judgment."
              : "Compare your confidence and factors with the qualified-review pattern."}
          </p>
        </div>
      </div>

      <div className="result-summary-grid">
        <div className="summary-stat">
          <span>Your call</span>
          <strong>{getOptionLabel(scenario, answer.selectedOptionId)}</strong>
        </div>
        <div className="summary-stat">
          <span>Your confidence</span>
          <strong className="tabular">{answer.confidence}%</strong>
        </div>
        <div className="summary-stat">
          <span>Demo recommendation</span>
          <strong>{getOptionLabel(scenario, scenario.recommendedDecision)}</strong>
        </div>
        <div className="summary-stat">
          <span>Scenario status</span>
          <strong><StatusBadge status={scenario.scenarioStatus} /></strong>
        </div>
      </div>

      <div className="expert-explanation">
        <span className="expert-explanation__label">
          <Sparkles aria-hidden="true" size={14} /> Authored teaching rationale
        </span>
        <p>{scenario.expertExplanation}</p>
        <div className="rule-citation">
          <BookOpen aria-hidden="true" size={16} />
          <span>
            <strong>{scenario.ruleReference}</strong>
            {scenario.ruleset} · {scenario.rulesetVersion} · {scenario.rulePath.join(" → ")}
          </span>
        </div>
      </div>

      <div className="factor-feedback">
        <div>
          <p className="field-label">Your factors</p>
          <div className="factor-feedback__row">
            {answer.selectedFactorKeys.map((key) => {
              const factor = scenario.factors.find((item) => item.key === key);
              const supported = Boolean(factor?.supportsRecommendation);
              return (
                <span className={`factor-tag ${supported ? "factor-tag--supported" : ""}`} key={key}>
                  {supported ? <Check aria-hidden="true" size={11} /> : <X aria-hidden="true" size={11} />}
                  {factor?.label ?? key}
                </span>
              );
            })}
          </div>
        </div>
        {missed && (
          <div>
            <p className="field-label">Factor to reconsider</p>
            <span className="factor-tag factor-tag--missed">
              <CircleAlert aria-hidden="true" size={11} /> {missed.label}: {missed.value}
            </span>
          </div>
        )}
      </div>

      <div className="distribution-section">
        <div>
          <h3 className="section-title">How the seeded groups responded</h3>
          <p className="section-description">
            Public patterns are shown separately from reviewer patterns and never treated as authority.
          </p>
        </div>
        <div className="distribution-grid">
          <DistributionBars
            distribution={scenario.communityDistribution}
            options={scenario.answerOptions}
            recommendedDecision={scenario.recommendedDecision}
          />
          <DistributionBars
            distribution={scenario.verifiedDistribution}
            options={scenario.answerOptions}
            recommendedDecision={scenario.recommendedDecision}
            tone="verified"
          />
        </div>
      </div>

      <div className="demo-notice">
        <CircleAlert aria-hidden="true" size={15} />
        <span>{scenario.reviewDisclaimer}</span>
      </div>

      <div className="button-row">
        {contrast && (
          <Link className="button button--secondary" href={`/compare?a=${scenario.id}&b=${contrast.case.id}`}>
            <GitCompareArrows aria-hidden="true" size={16} /> Compare a teaching contrast
          </Link>
        )}
        <Link className="button button--ghost" href={`/case/${scenario.id}`}>
          Open discussion <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>

      {nextCase && (
        <div className="recommendation-card">
          <span className="recommendation-card__icon" aria-hidden="true">
            <Sparkles size={17} />
          </span>
          <div>
            <strong>Next recommended case: {nextCase.title}</strong>
            <p>{nextReason ?? "Selected to keep your practice balanced."}</p>
          </div>
          <Link className="button button--secondary" href={`/case/${nextCase.id}`}>
            Train next <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>
      )}
    </section>
  );
}
