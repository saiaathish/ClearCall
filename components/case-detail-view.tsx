"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  CircleAlert,
  GitCompareArrows,
  MessageSquarePlus,
  Pin,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { cases } from "@/data/cases";
import type { DiscussionResponse, OfficiatingCase, PublishedCaseDraft } from "@/lib/types";
import { useDemo } from "@/context/demo-context";
import { useToast } from "@/components/toast-provider";
import { CaseCard } from "@/components/case-card";
import { DistributionBars } from "@/components/distribution-bars";
import { StatusBadge } from "@/components/status-badge";
import { SaveButton, ShareButton } from "@/components/case-actions";

function optionLabel(scenario: OfficiatingCase, id: string) {
  return scenario.answerOptions.find((option) => option.id === id)?.shortLabel ?? id;
}

export function CaseDetailView({ caseId }: { caseId: string }) {
  const {
    answers,
    hydrated,
    temporaryComments,
    publishedDrafts,
    addComment,
  } = useDemo();
  const { showToast } = useToast();
  const [comment, setComment] = useState("");
  const [commentDecision, setCommentDecision] = useState("");
  const [commentError, setCommentError] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const commentDecisionRef = useRef<HTMLSelectElement>(null);

  const scenario = useMemo(
    () => cases.find((item) => item.id === caseId || item.slug === caseId),
    [caseId],
  );
  const draft = useMemo(
    () => publishedDrafts.find((item) => item.id === caseId),
    [caseId, publishedDrafts],
  );

  if (!hydrated) {
    return (
      <div className="page-shell">
        <div className="loading-skeleton" style={{ minHeight: 720 }} aria-label="Loading case" />
      </div>
    );
  }

  if (!scenario) {
    if (draft) return <LocalDraftView draft={draft} />;
    return (
      <div className="page-shell not-found-state">
        <div className="empty-state">
          <div>
            <span className="empty-state__icon" aria-hidden="true"><CircleAlert size={23} /></span>
            <h1 className="section-title">Case not found</h1>
            <p>This case is not in the seeded catalog or your locally created drafts.</p>
            <Link className="button" href="/"><ArrowLeft size={16} /> Return to the feed</Link>
          </div>
        </div>
      </div>
    );
  }

  const answer = answers[scenario.id];
  const comments = [...scenario.seededDiscussion, ...(temporaryComments[scenario.id] ?? [])];
  const similarCases = scenario.similarCaseIds
    .map((id) => cases.find((item) => item.id === id))
    .filter((item): item is OfficiatingCase => Boolean(item));

  const submitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!comment.trim() || !commentDecision) {
      setCommentError(true);
      requestAnimationFrame(() => {
        if (!comment.trim()) commentRef.current?.focus();
        else commentDecisionRef.current?.focus();
      });
      return;
    }
    const localComment: DiscussionResponse = {
      id: `local-${scenario.id}-${Date.now()}`,
      caseId: scenario.id,
      author: {
        id: "jordan-lee-local",
        displayName: "Jordan Lee",
        role: "learner",
        avatarInitials: "JL",
        isVerified: false,
        isSynthetic: false,
        disclosure: "Local demo-user response stored only in this browser.",
      },
      body: comment.trim(),
      selectedOptionId: commentDecision,
      confidence: answer?.confidence,
      selectedFactorKeys: answer?.selectedFactorKeys ?? [scenario.criticalFactor],
      helpfulCount: 0,
      factorReactions: {},
      postedAtLabel: "Just now · local only",
      isPinned: false,
      isVerifiedExplanation: false,
      isSynthetic: false,
      disclosure: "Stored locally in this browser; not published to a community.",
    };
    addComment(scenario.id, localComment);
    setComment("");
    setCommentDecision("");
    setCommentError(false);
    showToast("Your response was added locally.", "success");
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header__copy">
          <p className="eyebrow">Case review</p>
          <h1 className="page-title">Read the call. Then read the reasoning.</h1>
          <p className="page-description">
            Structured factors make disagreement useful. Authored demo evidence remains separate from public opinion.
          </p>
        </div>
        <div className="button-row">
          <SaveButton caseId={scenario.id} showLabel />
          <ShareButton caseId={scenario.id} showLabel />
        </div>
      </div>

      <div className="case-detail-layout">
        <div className="detail-main">
          <CaseCard scenario={scenario} />

          {answer && (
            <>
              <section className="pinned-explanation" aria-labelledby="pinned-explanation-title">
                <div className="pinned-explanation__topline">
                  <span className="pinned-label"><Pin aria-hidden="true" size={13} /> Pinned authored explanation</span>
                  <StatusBadge status={scenario.scenarioStatus} />
                </div>
                <blockquote id="pinned-explanation-title">“{scenario.expertExplanation}”</blockquote>
                <footer>
                  <span className="avatar" aria-hidden="true">CD</span>
                  ClearCall demo desk · requires qualified expert review
                </footer>
              </section>

              <section className="content-section" aria-labelledby="distribution-heading">
                <div className="content-section__header">
                  <div>
                    <h2 className="section-title" id="distribution-heading">Three lenses, kept separate</h2>
                    <p className="section-description">These are illustrative authored patterns—not collected votes or official reviewer data.</p>
                  </div>
                </div>
                <div className="distribution-grid">
                  <DistributionBars distribution={scenario.communityDistribution} options={scenario.answerOptions} recommendedDecision={scenario.recommendedDecision} />
                  <DistributionBars distribution={scenario.verifiedDistribution} options={scenario.answerOptions} recommendedDecision={scenario.recommendedDecision} tone="verified" />
                  <DistributionBars distribution={scenario.learnerDistribution} options={scenario.answerOptions} recommendedDecision={scenario.recommendedDecision} tone="learner" />
                </div>
              </section>

              <section className="content-section" aria-labelledby="discussion-heading">
                <div className="content-section__header">
                  <div>
                    <h2 className="section-title" id="discussion-heading">Structured discussion</h2>
                    <p className="section-description">Responses are ordered for learning value; popularity does not define the ruling.</p>
                  </div>
                  <span className="meta-chip">{comments.length} responses</span>
                </div>
                <ul className="discussion-list">
                  {comments.map((response) => (
                    <DiscussionCard key={response.id} response={response} scenario={scenario} />
                  ))}
                </ul>
                <form className="comment-form" onSubmit={submitComment} noValidate>
                  <div>
                    <label className="field-label" htmlFor="local-comment">Add your reasoning</label>
                    <span className="field-hint" id="local-comment-hint">This response stays in your browser; there is no comment backend.</span>
                  </div>
                  <div className="comment-form__row">
                    <textarea
                      aria-describedby={`local-comment-hint${commentError ? " local-comment-error" : ""}`}
                      aria-invalid={commentError && !comment.trim() ? true : undefined}
                      className="textarea"
                      id="local-comment"
                      value={comment}
                      onChange={(event) => {
                        setComment(event.target.value);
                        setCommentError(false);
                      }}
                      placeholder="Explain which factors shaped your call…"
                      ref={commentRef}
                    />
                    <div>
                      <label className="field-label" htmlFor="local-comment-decision">Your decision</label>
                      <select
                        aria-describedby={commentError ? "local-comment-error" : undefined}
                        aria-invalid={commentError && !commentDecision ? true : undefined}
                        className="select"
                        id="local-comment-decision"
                        onChange={(event) => {
                          setCommentDecision(event.target.value);
                          setCommentError(false);
                        }}
                        ref={commentDecisionRef}
                        value={commentDecision}
                      >
                        <option value="">Choose</option>
                        {scenario.answerOptions.map((option) => <option key={option.id} value={option.id}>{option.shortLabel}</option>)}
                      </select>
                    </div>
                    <button className="button" type="submit"><MessageSquarePlus aria-hidden="true" size={16} /> Add locally</button>
                  </div>
                  {commentError && <p className="field-error" id="local-comment-error" role="alert"><CircleAlert aria-hidden="true" size={14} /> Add reasoning and choose a decision.</p>}
                </form>
              </section>
            </>
          )}
        </div>

        <aside className="detail-aside" aria-label="Case context and similar cases">
          <section className="content-section">
            <div className="content-section__header">
              <div>
                <h2 className="section-title">Case context</h2>
                <p className="section-description">The inputs that frame the decision.</p>
              </div>
            </div>
            <div className="detail-context-grid">
              <div className="detail-context-item"><span>Sport</span><strong>Soccer</strong></div>
              <div className="detail-context-item"><span>Level</span><strong>{scenario.competitionLevel}</strong></div>
              <div className="detail-context-item"><span>Difficulty</span><strong>{scenario.difficulty}</strong></div>
              <div className="detail-context-item"><span>Original call</span><strong>{scenario.originalDecision}</strong></div>
              <div className="detail-context-item"><span>Ruleset</span><strong>{scenario.rulesetVersion}</strong></div>
              <div className="detail-context-item"><span>Source</span><strong>{scenario.sourceType}</strong></div>
            </div>
            <div className="rule-citation" style={{ marginTop: 14 }}>
              <BookOpen aria-hidden="true" size={16} />
              <span><strong>{scenario.ruleReference}</strong>{scenario.rulePath.join(" → ")}</span>
            </div>
          </section>

          {similarCases.length > 0 && (
            <section className="content-section">
              <div className="content-section__header">
                <div><h2 className="section-title">Similar cases</h2><p className="section-description">Compare the factor pattern, not only the outcome.</p></div>
              </div>
              <div className="similar-list">
                {similarCases.map((item) => (
                  <Link className="similar-case" href={`/case/${item.id}`} key={item.id}>
                    <span className="similar-case__poster" aria-hidden="true" />
                    <span><strong>{item.title}</strong><span>{item.category} · {item.difficulty}</span></span>
                    <ArrowRight aria-hidden="true" size={15} />
                  </Link>
                ))}
              </div>
              <Link className="button button--secondary button--wide" href={`/compare?a=${scenario.id}&b=${similarCases[0]?.id ?? ""}`} style={{ marginTop: 13 }}>
                <GitCompareArrows aria-hidden="true" size={16} /> Compare side by side
              </Link>
            </section>
          )}

          <div className="demo-notice">
            <CircleAlert aria-hidden="true" size={15} />
            <span>{scenario.reviewDisclaimer}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DiscussionCard({ response, scenario }: { response: DiscussionResponse; scenario: OfficiatingCase }) {
  const [helpful, setHelpful] = useState(false);
  const [factorVotes, setFactorVotes] = useState<Record<string, "agree" | "disagree">>({});

  const toggleFactorVote = (key: string, nextVote: "agree" | "disagree") => {
    setFactorVotes((current) => {
      if (current[key] !== nextVote) return { ...current, [key]: nextVote };
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  return (
    <li className="discussion-card">
      <div className="discussion-card__header">
        <div className="discussion-author">
          <span className="avatar" aria-hidden="true">{response.author.avatarInitials}</span>
          <span className="discussion-author__copy">
            <strong>
              {response.author.displayName}
              {response.author.isVerified && <BadgeCheck className="verified-icon" aria-label="Verified referee" size={14} />}
            </strong>
            <span>{response.author.role.replaceAll("_", " ")} · {response.postedAtLabel}</span>
          </span>
        </div>
        <span className="decision-badge">{optionLabel(scenario, response.selectedOptionId)}</span>
      </div>
      <p className="discussion-card__body">{response.body}</p>
      <div className="discussion-card__meta">
        {response.confidence !== undefined && <span className="meta-chip">{response.confidence}% confidence</span>}
        {response.selectedFactorKeys.map((key) => {
          const factor = scenario.factors.find((item) => item.key === key);
          return <span className="factor-tag" key={key}>{factor?.label ?? key}</span>;
        })}
      </div>
      {response.ruleCitation && (
        <div className="rule-citation"><BookOpen aria-hidden="true" size={14} /><span><strong>Rule citation</strong>{response.ruleCitation}</span></div>
      )}
      <div className="discussion-card__footer">
        <button className="helpful-button" data-active={helpful || undefined} type="button" onClick={() => setHelpful((value) => !value)} aria-pressed={helpful}>
          <ThumbsUp aria-hidden="true" size={13} /> Helpful {response.helpfulCount + (helpful ? 1 : 0)}
        </button>
        <div className="factor-votes" aria-label="React to reasoning factors">
          {response.selectedFactorKeys.slice(0, 2).map((key) => {
            const factor = scenario.factors.find((item) => item.key === key);
            const vote = factorVotes[key];
            return (
              <span key={key}>
                <button
                  className="factor-vote"
                  data-active={vote === "agree" || undefined}
                  type="button"
                  onClick={() => toggleFactorVote(key, "agree")}
                  aria-label={`Agree with factor ${factor?.label ?? key}`}
                  aria-pressed={vote === "agree"}
                >
                  <Check aria-hidden="true" size={12} /> {factor?.label ?? key}
                </button>
                <button
                  className="factor-vote"
                  data-active={vote === "disagree" || undefined}
                  type="button"
                  onClick={() => toggleFactorVote(key, "disagree")}
                  aria-label={`Disagree with factor ${factor?.label ?? key}`}
                  aria-pressed={vote === "disagree"}
                >
                  <ThumbsDown aria-hidden="true" size={12} />
                </button>
              </span>
            );
          })}
        </div>
      </div>
    </li>
  );
}

function LocalDraftView({ draft }: { draft: PublishedCaseDraft }) {
  return (
    <div className="page-shell page-shell--narrow">
      <Link className="text-link" href="/publish"><ArrowLeft size={14} /> Back to publisher</Link>
      <section className="success-state" style={{ marginTop: 20 }}>
        <span className="success-state__icon" aria-hidden="true"><Check size={24} /></span>
        <p className="eyebrow" style={{ marginTop: 18 }}>Local case preview</p>
        <h1>{draft.title}</h1>
        <p>{draft.prompt}</p>
        <div className="meta-row">
          <span className="status-badge status-badge--pending">Pending expert review</span>
          <span className="meta-chip">{draft.category}</span>
          <span className="meta-chip">{draft.difficulty}</span>
        </div>
        <div className="demo-notice" style={{ marginTop: 18 }}>
          <CircleAlert size={15} /> This draft exists only in this browser. It has not been publicly published, moderated, or expert reviewed.
        </div>
      </section>
    </div>
  );
}
