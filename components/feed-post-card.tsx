"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock3, MessageCircle } from "lucide-react";
import type { MediaKind, OfficiatingCase } from "@/lib/types";
import { useDemo } from "@/context/demo-context";
import { CaseVideo } from "@/components/case-video";
import { ReportButton, SaveButton, ShareButton } from "@/components/case-actions";
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
}: {
  scenario: OfficiatingCase;
  priority?: boolean;
}) {
  const { answers, temporaryComments } = useDemo();
  const mediaKind = getMediaKind(scenario);
  const comments = [...scenario.seededDiscussion, ...(temporaryComments[scenario.id] ?? [])];
  const detailHref = `/case/${scenario.id}`;

  return (
    <article
      className="feed-post"
      data-media={mediaKind}
      aria-labelledby={`feed-post-${scenario.id}-title`}
    >
      <header className="feed-post__header">
        <span className="avatar" aria-hidden="true">{scenario.publisher.avatarInitials}</span>
        <div className="publisher">
          <div className="publisher__name">{scenario.publisher.displayName}</div>
          <div className="publisher__meta">
            {scenario.publisher.organization ?? "Independent contributor"} · {formatPublishedAt(scenario.publishedAt)}
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
            </div>
            <h2 id={`feed-post-${scenario.id}-title`}>
              <Link href={detailHref}>{scenario.prompt}</Link>
            </h2>
            <p>{scenario.description}</p>
            <div className="feed-post__context">
              <span><Clock3 aria-hidden="true" size={14} /> Original call: {scenario.originalDecision}</span>
              <span><BookOpen aria-hidden="true" size={14} /> {scenario.ruleReference}</span>
            </div>
          </div>

          <section className="comment-preview" aria-labelledby={`feed-post-${scenario.id}-discussion`}>
            <div className="comment-preview__header">
              <h3 id={`feed-post-${scenario.id}-discussion`}>
                <MessageCircle aria-hidden="true" size={15} /> Discussion
              </h3>
              <span>{comments.length} {comments.length === 1 ? "response" : "responses"}</span>
            </div>
            {comments.length > 0 ? (
              <ul>
                {comments.slice(0, 2).map((comment) => (
                  <li key={comment.id}>
                    <span className="avatar avatar--small" aria-hidden="true">{comment.author.avatarInitials}</span>
                    <span>
                      <strong>{comment.author.displayName}</strong>
                      <span>{comment.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No responses yet. Open the case to add your reasoning.</p>
            )}
          </section>

          <footer className="feed-post__footer">
            <span>{answers[scenario.id] ? "Your call is recorded" : "Decision and evidence are on the case page"}</span>
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
