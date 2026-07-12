"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock3, MessageCircle } from "lucide-react";
import type { MediaKind, OfficiatingCase } from "@/lib/types";
import { useDemo } from "@/context/demo-context";
import { CaseVideo } from "@/components/case-video";
import { ReportButton, SaveButton, ShareButton } from "@/components/case-actions";
import { PublisherLink, PublisherNameLink } from "@/components/publisher-link";
import { StatusBadge } from "@/components/status-badge";

function formatPublishedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getMediaKind(scenario: OfficiatingCase): MediaKind {
  if (scenario.mediaKind) return scenario.mediaKind;
  if (scenario.videoSrc) return "video";
  if (scenario.imageSrc || scenario.posterSrc) return "image";
  return "text";
}

export function FeedPostCard({
  scenario,
  priority = false,
  appearanceKey,
}: {
  scenario: OfficiatingCase;
  priority?: boolean;
  /** Unique per feed appearance so reshuffled repeats stay accessible. */
  appearanceKey?: string;
}) {
  const { answers, temporaryComments } = useDemo();
  const mediaKind = getMediaKind(scenario);
  const comments = [...scenario.seededDiscussion, ...(temporaryComments[scenario.id] ?? [])];
  const detailHref = `/case/${scenario.id}`;
  const domId = (appearanceKey ?? scenario.id).replace(/[^a-zA-Z0-9_-]+/g, "-");
  const titleId = `feed-post-${domId}-title`;
  const discussionId = `feed-post-${domId}-discussion`;
  const previewComments = comments.slice(0, 3);

  return (
    <article
      className="feed-post"
      data-media={mediaKind}
      aria-labelledby={titleId}
    >
      <header className="feed-post__header">
        <div className="publisher-row">
          <PublisherLink publisher={scenario.publisher} />
          <div className="publisher">
            <PublisherNameLink className="publisher__name" publisher={scenario.publisher}>
              {scenario.publisher.displayName}
            </PublisherNameLink>
            <div className="publisher__meta">
              {scenario.publisher.organization ?? "Independent contributor"} · {formatPublishedAt(scenario.publishedAt)}
            </div>
          </div>
        </div>
        <div className="feed-post__actions" aria-label={`Actions for ${scenario.title}`}>
          <SaveButton caseId={scenario.id} />
          <ShareButton caseId={scenario.id} />
          <ReportButton caseId={scenario.id} />
        </div>
      </header>

      <div className="feed-post__layout">
        {mediaKind !== "text" && (
          <div className="feed-post__media">
            <CaseVideo scenario={scenario} compact priority={priority} />
          </div>
        )}

        <div className="feed-post__content">
          <div className="feed-post__summary">
            <div className="meta-row">
              <StatusBadge status={scenario.scenarioStatus} />
              <span className="meta-chip">{scenario.category}</span>
              <span className="meta-chip">{scenario.difficulty}</span>
              <span className="meta-chip meta-chip--media">{mediaKind}</span>
            </div>
            <h2 id={titleId}>
              <Link className="feed-post__hit" href={detailHref}>
                {scenario.prompt}
              </Link>
            </h2>
            <p>{scenario.description}</p>
            <div className="feed-post__context">
              <span><Clock3 aria-hidden="true" size={14} /> Original call: {scenario.originalDecision}</span>
              <span><BookOpen aria-hidden="true" size={14} /> {scenario.ruleReference}</span>
            </div>
          </div>

          <section className="comment-preview" aria-labelledby={discussionId}>
            <div className="comment-preview__header">
              <h3 id={discussionId}>
                <MessageCircle aria-hidden="true" size={15} /> Discussion
              </h3>
            </div>
            {previewComments.length > 0 ? (
              <ul>
                {previewComments.map((comment) => (
                  <li key={comment.id}>
                    <PublisherLink publisher={comment.author} size="sm" />
                    <span>
                      <PublisherNameLink publisher={comment.author}>
                        <strong>{comment.author.displayName}</strong>
                      </PublisherNameLink>
                      <span>{comment.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No responses yet.</p>
            )}
          </section>

          <footer className="feed-post__footer">
            <span>{answers[scenario.id] ? "Call recorded" : null}</span>
            <Link className="feed-post__open" href={detailHref}>
              {answers[scenario.id] ? "Review your call" : "Make your call"}
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          </footer>
        </div>
      </div>
    </article>
  );
}
