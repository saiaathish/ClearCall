"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { FEED_PEOPLE, personToPublisher } from "@/data/feed-people";
import type { DiscussionResponse, Distribution, OfficiatingCase, PublishedCaseDraft } from "@/lib/types";
import { useDemo } from "@/context/demo-context";
import { useToast } from "@/components/toast-provider";
import { CaseCard } from "@/components/case-card";
import { DistributionBars } from "@/components/distribution-bars";
import { PublisherLink } from "@/components/publisher-link";
import { StatusBadge } from "@/components/status-badge";
import { SaveButton, ShareButton } from "@/components/case-actions";
import { createClient } from "@/lib/supabase/client";
import { fetchLiveDistribution } from "@/lib/voting";
import { toggleHelpfulVote } from "@/lib/reputation";

/** Overrides a static demo distribution with live vote data when votes exist. */
function withLiveOverride(
  base: Distribution,
  live: { percentages: Readonly<Record<string, number>>; totalVotes: number } | null,
): Distribution {
  if (!live) return base;
  return {
    ...base,
    percentages: live.percentages,
    isSynthetic: false,
    basis: base.basis === "verified_reviewers" ? "verified_reviewers" : "live_community",
  };
}

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
  const supabase = useMemo(() => createClient(), []);
  const [comment, setComment] = useState("");
  const [commentDecision, setCommentDecision] = useState("");
  const [commentError, setCommentError] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const commentDecisionRef = useRef<HTMLSelectElement>(null);
  const [liveDistribution, setLiveDistribution] = useState<{
    community: { percentages: Readonly<Record<string, number>>; totalVotes: number } | null;
    verified: { percentages: Readonly<Record<string, number>>; totalVotes: number } | null;
  } | null>(null);

  const scenario = useMemo(
    () => cases.find((item) => item.id === caseId || item.slug === caseId),
    [caseId],
  );
  const draft = useMemo(
    () => publishedDrafts.find((item) => item.id === caseId),
    [caseId, publishedDrafts],
  );

  useEffect(() => {
    if (!scenario) return;
    let active = true;
    fetchLiveDistribution(
      supabase,
      scenario.id,
      scenario.answerOptions.map((option) => option.id),
    ).then((result) => {
      if (active) setLiveDistribution(result);
    });
    return () => {
      active = false;
    };
  }, [scenario, supabase]);

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
    const jordan =
      FEED_PEOPLE.find((person) => person.displayName === "Jordan Lee") ??
      FEED_PEOPLE[0]!;
    const localComment: DiscussionResponse = {
      id: `local-${scenario.id}-${Date.now()}`,
      caseId: scenario.id,
      author: {
        ...personToPublisher(jordan),
        isSynthetic: false,
        disclosure: "Local demo-user response stored only in this browser.",
      },
      body: comment.trim(),
      selectedOptionId: commentDecision,
      confidence: answer?.confidence,
      selectedFactorKeys: answer?.selectedFactorKeys ?? [scenario.criticalFactor],
      helpfulCount: 0,
      factorReactions: {},
      postedAtLabel: "Just now",
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
      <header className="thread-header">
        <Link className="thread-back" href="/">
          <ArrowLeft aria-hidden="true" size={18} /> Back to feed
        </Link>
        <div className="thread-header__title">
          <span>Case</span>
          <h1>{scenario.title}</h1>
        </div>
        <div className="button-row">
          <SaveButton caseId={scenario.id} showLabel />
          <ShareButton caseId={scenario.id} showLabel />
        </div>
      </header>

      <div className="case-detail-layout">
        <div className="detail-main">
          <CaseCard scenario={scenario} />

          {answer && (
            <>
              <section className="pinned-explanation" aria-labelledby="pinned-explanation-title">
                <div className="pinned-explanation__topline">
                  <span className="pinned-label"><Pin aria-hidden="true" size={13} /> Pinned explanation</span>
                  <StatusBadge status={scenario.scenarioStatus} />
                </div>
                <blockquote id="pinned-explanation-title">“{scenario.expertExplanation}”</blockquote>
              </section>

              <section className="content-section" aria-labelledby="distribution-heading">
                <div className="content-section__header">
                  <div>
                    <h2 className="section-title" id="distribution-heading">How others called it</h2>
                  </div>
                </div>
                <div className="distribution-grid">
                  <DistributionBars distribution={withLiveOverride(scenario.communityDistribution, liveDistribution?.community ?? null)} options={scenario.answerOptions} recommendedDecision={scenario.recommendedDecision} />
                  <DistributionBars distribution={withLiveOverride(scenario.verifiedDistribution, liveDistribution?.verified ?? null)} options={scenario.answerOptions} recommendedDecision={scenario.recommendedDecision} tone="verified" />
                  <DistributionBars distribution={scenario.learnerDistribution} options={scenario.answerOptions} recommendedDecision={scenario.recommendedDecision} tone="learner" />
                </div>
              </section>
            </>
          )}

          <section className="content-section" aria-labelledby="discussion-heading">
                <div className="content-section__header">
                  <div>
                    <h2 className="section-title" id="discussion-heading">Discussion</h2>
                  </div>
                </div>
                <form className="comment-form" onSubmit={submitComment} noValidate>
                  <div>
                    <label className="field-label" htmlFor="local-comment">Add your reasoning</label>
                  </div>
                  <div className="comment-form__row">
                    <textarea
                      aria-describedby={commentError ? "local-comment-error" : undefined}
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
                <ul className="discussion-list">
                  {comments.map((response) => (
                    <DiscussionCard key={response.id} response={response} scenario={scenario} />
                  ))}
                </ul>
          </section>
        </div>

        <aside className="detail-aside" aria-label="Case context and similar cases">
          <section className="content-section">
            <div className="content-section__header">
              <div>
                <h2 className="section-title">Case context</h2>
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

          <section className="content-section">
            <Link className="button button--secondary button--wide" href={`/compare?case=${scenario.id}`}>
              <GitCompareArrows aria-hidden="true" size={16} /> Compare match vs expert
            </Link>
          </section>

          {similarCases.length > 0 && (
            <section className="content-section">
              <div className="content-section__header">
                <div><h2 className="section-title">Similar cases</h2></div>
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
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function DiscussionCard({ response, scenario }: { response: DiscussionResponse; scenario: OfficiatingCase }) {
  const { user } = useDemo();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [helpful, setHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(response.helpfulCount);
  const [helpfulPending, setHelpfulPending] = useState(false);
  const [factorVotes, setFactorVotes] = useState<Record<string, "agree" | "disagree">>({});

  const isPersistedComment = !response.id.startsWith("local-");

  const handleHelpfulClick = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }
    if (!isPersistedComment || helpfulPending) return;
    setHelpfulPending(true);
    const result = await toggleHelpfulVote(supabase, response.id);
    if (result) {
      setHelpful(result.isActive);
      setHelpfulCount(result.helpfulCount);
    }
    setHelpfulPending(false);
  };

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
        <PublisherLink className="discussion-author" publisher={response.author}>
          <span className="discussion-author__copy">
            <strong>
              {response.author.displayName}
              {response.author.isVerified && <BadgeCheck className="verified-icon" aria-label="Verified referee" size={14} />}
            </strong>
            <span>{response.author.role.replaceAll("_", " ")} · {response.postedAtLabel}</span>
          </span>
        </PublisherLink>
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
        <button
          className="helpful-button"
          data-active={helpful || undefined}
          data-disabled={!user || undefined}
          disabled={helpfulPending}
          type="button"
          onClick={handleHelpfulClick}
          aria-pressed={helpful}
          aria-label={user ? undefined : "Sign in to mark this response as helpful"}
        >
          <ThumbsUp aria-hidden="true" size={13} /> Helpful {helpfulCount}
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
      </section>
    </div>
  );
}
