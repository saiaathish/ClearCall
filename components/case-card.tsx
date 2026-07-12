"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type CSSProperties, type FormEvent, type RefObject } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  GitCompareArrows,
  LoaderCircle,
  PencilLine,
  RotateCcw,
  ShieldQuestion,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { cases } from "@/data/cases";
import { findTeachingContrast, rankPersonalizedCases } from "@/lib/algorithms";
import {
  createDecisionDraft,
  createUserAnswer,
  getInitialAttempt,
  hasDecisionDraftChanged,
  isDecisionDraftComplete,
  type DecisionDraft,
} from "@/lib/decision-draft";
import type { OfficiatingCase, UserAnswer } from "@/lib/types";
import { useDemo, type SubmitAnswerResult } from "@/context/demo-context";
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
  const { answers, isDemoSession, submitAnswer } = useDemo();
  const { showToast } = useToast();
  const savedAnswer = answers[scenario.id];
  const resultRef = useRef<HTMLElement>(null);

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

  const saveDecision = async (draft: DecisionDraft): Promise<SubmitAnswerResult> => {
    const wasRevision = Boolean(savedAnswer);
    const answer = createUserAnswer(
      scenario.id,
      draft,
      new Date().toISOString(),
      savedAnswer,
    );
    const result = await submitAnswer(answer);
    if (result === "error") {
      showToast("We couldn't save your call. Your changes are still here.", "info");
      return result;
    }
    if (result !== "saved") return result;

    if (!wasRevision) onSubmitted?.(scenario.id);
    showToast(
      wasRevision ? "Your call was updated." : "Call submitted. The evidence is now revealed.",
      "success",
    );
    window.requestAnimationFrame(() => resultRef.current?.focus());
    return result;
  };

  const answerVersion = savedAnswer
    ? [
        savedAnswer.answeredAt,
        savedAnswer.selectedOptionId,
        savedAnswer.confidence,
        [...savedAnswer.selectedFactorKeys].sort().join(","),
      ].join(":")
    : "unanswered";

  return (
    <article
      className="case-card"
      data-media={scenario.mediaKind ?? (scenario.videoSrc ? "video" : scenario.imageSrc || scenario.posterSrc ? "image" : "text")}
      aria-labelledby={`case-${scenario.id}-title`}
    >
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

        <DecisionForm
          key={`${scenario.id}:${answerVersion}`}
          scenario={scenario}
          savedAnswer={savedAnswer}
          isDemoResponse={isDemoSession && Boolean(savedAnswer)}
          onSave={saveDecision}
        />

        {!savedAnswer && (
          <Link className="text-link" href={`/case/${scenario.id}`}>
            Open full case context <ArrowRight aria-hidden="true" size={14} />
          </Link>
        )}
      </div>

      {savedAnswer && (
        <ResultPanel
          scenario={scenario}
          answer={savedAnswer}
          contrast={contrast}
          nextCase={nextRanked?.case}
          nextReason={nextRanked?.reason}
          resultRef={resultRef}
        />
      )}
    </article>
  );
}

function DecisionForm({
  scenario,
  savedAnswer,
  isDemoResponse,
  onSave,
}: {
  scenario: OfficiatingCase;
  savedAnswer?: UserAnswer;
  isDemoResponse: boolean;
  onSave: (draft: DecisionDraft) => Promise<SubmitAnswerResult>;
}) {
  const initialDraft = createDecisionDraft(savedAnswer);
  const [selectedOptionId, setSelectedOptionId] = useState(initialDraft.selectedOptionId);
  const [confidence, setConfidence] = useState(initialDraft.confidence);
  const [selectedFactorKeys, setSelectedFactorKeys] = useState<string[]>([
    ...initialDraft.selectedFactorKeys,
  ]);
  const [attempted, setAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const firstDecisionRef = useRef<HTMLInputElement>(null);
  const firstFactorRef = useRef<HTMLInputElement>(null);
  const draft: DecisionDraft = { selectedOptionId, confidence, selectedFactorKeys };
  const hasChanges = hasDecisionDraftChanged(savedAnswer, draft);
  const decisionMissing = attempted && !selectedOptionId;
  const factorsMissing = attempted && selectedFactorKeys.length === 0;

  const handleFactor = (key: string, checked: boolean) => {
    setSelectedFactorKeys((current) =>
      checked ? [...new Set([...current, key])] : current.filter((item) => item !== key),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);
    if (!isDecisionDraftComplete(draft)) {
      requestAnimationFrame(() => {
        if (!selectedOptionId) firstDecisionRef.current?.focus();
        else firstFactorRef.current?.focus();
      });
      return;
    }
    setIsSaving(true);
    const result = await onSave(draft);
    if (result !== "saved") setIsSaving(false);
  };

  const discardChanges = () => {
    const current = createDecisionDraft(savedAnswer);
    setSelectedOptionId(current.selectedOptionId);
    setConfidence(current.confidence);
    setSelectedFactorKeys([...current.selectedFactorKeys]);
    setAttempted(false);
    requestAnimationFrame(() =>
      formRef.current
        ?.querySelector<HTMLInputElement>('input[type="radio"]:checked')
        ?.focus(),
    );
  };

  return (
    <form
      className="decision-form"
      onSubmit={handleSubmit}
      noValidate
      ref={formRef}
      aria-busy={isSaving || undefined}
    >
      <fieldset
        aria-describedby={decisionMissing ? `decision-${scenario.id}-error` : undefined}
        aria-invalid={decisionMissing || undefined}
        className="choice-group"
      >
        <legend>1 · Make your decision</legend>
        <div className="choice-grid">
          {scenario.answerOptions.map((option, index) => (
            <label className="choice-option" key={option.id} title={option.description}>
              <input
                aria-describedby={decisionMissing ? `decision-${scenario.id}-error` : undefined}
                className="sr-only"
                type="radio"
                name={`decision-${scenario.id}`}
                value={option.id}
                checked={selectedOptionId === option.id}
                disabled={isSaving}
                onChange={() => setSelectedOptionId(option.id)}
                ref={index === 0 ? firstDecisionRef : undefined}
              />
              <span className="choice-option__control" aria-hidden="true" />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {decisionMissing && (
          <p className="field-error" id={`decision-${scenario.id}-error`} role="alert">
            <CircleAlert aria-hidden="true" size={14} /> Choose one decision before revealing the evidence.
          </p>
        )}
      </fieldset>

      <div className="confidence-row">
        <label htmlFor={`confidence-${scenario.id}`}>2 · Your confidence</label>
        <output className="confidence-value" htmlFor={`confidence-${scenario.id}`}>
          {confidence}%
        </output>
        <input
          className="range-input"
          id={`confidence-${scenario.id}`}
          type="range"
          min="50"
          max="100"
          step="1"
          value={confidence}
          disabled={isSaving}
          onChange={(event) => setConfidence(Number(event.target.value))}
          style={{ "--range-progress": `${(confidence - 50) * 2}%` } as CSSProperties}
        />
        <div className="range-labels" aria-hidden="true">
          <span>50% unsure</span>
          <span>100% certain</span>
        </div>
      </div>

      <fieldset
        aria-describedby={factorsMissing ? `factors-${scenario.id}-error` : undefined}
        aria-invalid={factorsMissing || undefined}
        className="factor-group"
      >
        <legend>3 · What influenced your call?</legend>
        <div className="factor-grid">
          {scenario.factors.map((factor, index) => (
            <label className="factor-option" key={factor.key} title={factor.explanation}>
              <input
                aria-describedby={factorsMissing ? `factors-${scenario.id}-error` : undefined}
                aria-invalid={factorsMissing || undefined}
                className="sr-only"
                type="checkbox"
                name={`factor-${scenario.id}`}
                value={factor.key}
                checked={selectedFactorKeys.includes(factor.key)}
                disabled={isSaving}
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
        {factorsMissing && (
          <p className="field-error" id={`factors-${scenario.id}-error`} role="alert">
            <CircleAlert aria-hidden="true" size={14} /> Select at least one reasoning factor.
          </p>
        )}
      </fieldset>

      <div className="decision-actions">
        <p className="decision-privacy" aria-live="polite">
          <PencilLine aria-hidden="true" size={13} />
          {isSaving
            ? "Saving your call…"
            : savedAnswer
            ? hasChanges
              ? "Unsaved changes. Update the call to refresh the result below."
              : isDemoResponse
                ? (savedAnswer.revisionCount ?? 0) > 0
                  ? "Current demo profile call shown. Change any choice to reconsider it."
                  : "Seeded demo profile call shown. Change any choice to reconsider it."
                : "Current response shown. Change any choice to reconsider it."
            : "Results stay hidden until you submit."}
        </p>
        <div className="decision-action-buttons">
          {savedAnswer && hasChanges && (
            <button
              className="button button--ghost"
              type="button"
              onClick={discardChanges}
              disabled={isSaving}
            >
              <RotateCcw aria-hidden="true" size={15} /> Discard changes
            </button>
          )}
          <button
            className="button"
            type="submit"
            disabled={isSaving || (Boolean(savedAnswer) && !hasChanges)}
          >
            {isSaving ? (
              <><LoaderCircle className="spin" aria-hidden="true" size={16} /> Saving…</>
            ) : savedAnswer ? (
              hasChanges ? (
                <>Update your call <ArrowRight aria-hidden="true" size={16} /></>
              ) : (
                <><CheckCircle2 aria-hidden="true" size={16} /> Call is current</>
              )
            ) : (
              <>Reveal the evidence <ArrowRight aria-hidden="true" size={16} /></>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

function ResultPanel({
  scenario,
  answer,
  contrast,
  nextCase,
  nextReason,
  resultRef,
}: {
  scenario: OfficiatingCase;
  answer: UserAnswer;
  contrast: ReturnType<typeof findTeachingContrast>;
  nextCase?: OfficiatingCase;
  nextReason?: string;
  resultRef: RefObject<HTMLElement | null>;
}) {
  const aligned = answer.selectedOptionId === scenario.recommendedDecision;
  const initialAttempt = getInitialAttempt(answer);
  const wasRevised = (answer.revisionCount ?? 0) > 0;
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
    <section
      className="result-panel"
      aria-labelledby={`result-${scenario.id}-title`}
      ref={resultRef}
      tabIndex={-1}
    >
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
            {wasRevised ? " Your first attempt remains the calibration record." : ""}
          </p>
        </div>
      </div>

      <div className="result-summary-grid">
        <div className="summary-stat">
          <span>Current call</span>
          <strong>{getOptionLabel(scenario, answer.selectedOptionId)}</strong>
        </div>
        <div className="summary-stat">
          <span>Current confidence</span>
          <strong className="tabular">{answer.confidence}%</strong>
        </div>
        {wasRevised && (
          <>
            <div className="summary-stat">
              <span>First attempt</span>
              <strong>{getOptionLabel(scenario, initialAttempt.selectedOptionId)}</strong>
            </div>
            <div className="summary-stat">
              <span>First confidence</span>
              <strong className="tabular">{initialAttempt.confidence}%</strong>
            </div>
          </>
        )}
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
