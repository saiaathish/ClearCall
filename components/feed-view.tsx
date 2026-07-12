"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Funnel, LoaderCircle, RotateCcw, SquarePlus } from "lucide-react";
import { cases } from "@/data/cases";
import type { CaseCategory, OfficiatingCase } from "@/lib/types";
import { rankPersonalizedCases } from "@/lib/algorithms";
import {
  FEED_BATCH_SIZE,
  FEED_MAX_RENDERED,
  FEED_PRELOAD_AHEAD,
  appendFeedBatch,
  trimFeedItems,
  upcomingMediaSrcs,
  type FeedItem,
} from "@/lib/feed-stream";
import { getMediaPreloadCache } from "@/lib/media-preload";
import { useDemo } from "@/context/demo-context";
import { FeedPostCard } from "@/components/feed-post-card";

const categoryOptions = [...new Set(cases.map((scenario) => scenario.category))] as CaseCategory[];

function isCaseCategory(value: string | null): value is CaseCategory {
  return Boolean(value && categoryOptions.includes(value as CaseCategory));
}

function seedFeed(pool: readonly OfficiatingCase[]): FeedItem[] {
  if (pool.length === 0) return [];
  return trimFeedItems(
    appendFeedBatch(pool, [], { batchSize: FEED_BATCH_SIZE }),
    FEED_MAX_RENDERED,
  );
}

function poolKeyFor(category: CaseCategory | "all", pool: readonly OfficiatingCase[]): string {
  return `${category}::${pool.map((scenario) => scenario.id).join("|")}`;
}

export function FeedView() {
  const { answers, hydrated, removedCaseIds } = useDemo();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("foul");
  const activeCategory: CaseCategory | "all" = isCaseCategory(filterParam) ? filterParam : "all";
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [boundPoolKey, setBoundPoolKey] = useState<string | null>(null);
  const [isAppending, setIsAppending] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const answerList = useMemo(() => Object.values(answers), [answers]);
  const removedIds = useMemo(() => new Set(removedCaseIds), [removedCaseIds]);
  const orderedCases = useMemo(() => {
    const available = cases.filter((scenario) => !removedIds.has(scenario.id));
    const ranked = rankPersonalizedCases(available, answerList).map((entry) => entry.case);
    const rankedIds = new Set(ranked.map((scenario) => scenario.id));
    return [...ranked, ...available.filter((scenario) => !rankedIds.has(scenario.id))];
  }, [answerList, removedIds]);
  const filteredCases = useMemo(
    () => activeCategory === "all"
      ? orderedCases
      : orderedCases.filter((scenario) => scenario.category === activeCategory),
    [activeCategory, orderedCases],
  );
  const poolKey = poolKeyFor(activeCategory, filteredCases);

  // Reset the mix when the foul filter or available catalog changes.
  // (React-recommended "adjust state while rendering" pattern — not an effect.)
  if (hydrated && boundPoolKey !== poolKey) {
    setBoundPoolKey(poolKey);
    setFeedItems(seedFeed(filteredCases));
  }

  const loadMore = useCallback(() => {
    if (loadingRef.current || filteredCases.length === 0) return;
    loadingRef.current = true;
    setIsAppending(true);

    window.requestAnimationFrame(() => {
      setFeedItems((current) => {
        const expanded = appendFeedBatch(filteredCases, current, {
          batchSize: FEED_BATCH_SIZE,
        });
        const trimmed = trimFeedItems(expanded, FEED_MAX_RENDERED);
        const warm = upcomingMediaSrcs(
          trimmed,
          Math.max(0, trimmed.length - FEED_BATCH_SIZE),
          FEED_PRELOAD_AHEAD,
        );
        getMediaPreloadCache().preload(warm);
        setAnnouncement(`${FEED_BATCH_SIZE} more cases loaded. Keep scrolling.`);
        return trimmed;
      });
      setIsAppending(false);
      loadingRef.current = false;
    });
  }, [filteredCases]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || filteredCases.length === 0 || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "700px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredCases.length, loadMore]);

  // Warm a few upcoming media URLs without pinning the whole library in cache.
  useEffect(() => {
    if (feedItems.length === 0) return;
    const warm = upcomingMediaSrcs(
      feedItems,
      Math.max(0, feedItems.length - FEED_BATCH_SIZE),
      FEED_PRELOAD_AHEAD,
    );
    getMediaPreloadCache().preload(warm);
  }, [feedItems]);

  const setCategory = (category: CaseCategory | "all") => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (category === "all") nextParams.delete("foul");
    else nextParams.set("foul", category);
    const query = nextParams.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
    setAnnouncement(
      category === "all"
        ? `${cases.length} seeded cases reshuffled across all foul types.`
        : `Feed filtered to ${category} and reshuffled.`,
    );
  };

  if (!hydrated) {
    return (
      <div className="feed-page" aria-label="Loading the case feed">
        <div className="feed-toolbar loading-skeleton" style={{ minHeight: 82 }} />
        <div className="feed-stream-skeleton" aria-hidden="true">
          <div className="loading-skeleton" />
          <div className="loading-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <header className="feed-toolbar">
        <div className="feed-toolbar__title">
          <h1>Feed</h1>
          <p>Infinite mix of text, image, and video cases. Scroll for the next 5.</p>
        </div>
        <div className="feed-toolbar__actions">
          <label className="feed-filter" htmlFor="foul-type-filter">
            <Funnel aria-hidden="true" size={17} />
            <span>Foul type</span>
            <select
              id="foul-type-filter"
              onChange={(event) => setCategory(event.target.value as CaseCategory | "all")}
              value={activeCategory}
            >
              <option value="all">All incidents</option>
              {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
        </div>
      </header>

      <Link className="feed-composer" href="/publish">
        <span className="profile-avatar" aria-hidden="true">JL</span>
        <span>
          <strong>Publish a case</strong>
          <small>Start with text, an image, or a video.</small>
        </span>
        <SquarePlus aria-hidden="true" size={20} />
      </Link>

      <div className="feed-result-line">
        <span>{filteredCases.length} {filteredCases.length === 1 ? "case" : "cases"} in mix</span>
        <span>{answerList.length}/{cases.length} reviewed</span>
      </div>

      {feedItems.length > 0 ? (
        <ol className="feed-stream" aria-label="Officiating case feed">
          {feedItems.map((item, index) => (
            <li key={item.key}>
              <FeedPostCard
                appearanceKey={item.key}
                scenario={item.scenario}
                priority={index === 0}
              />
            </li>
          ))}
        </ol>
      ) : (
        <section className="feed-empty" aria-labelledby="feed-empty-title">
          <h2 id="feed-empty-title">No seeded cases match this foul type.</h2>
          <p>Clear the filter to return to the full local case catalog.</p>
          <button className="button button--secondary" type="button" onClick={() => setCategory("all")}>
            <RotateCcw aria-hidden="true" size={16} /> Clear filter
          </button>
        </section>
      )}

      <div className="feed-loader" ref={sentinelRef}>
        {filteredCases.length > 0 ? (
          <button className="button button--secondary" type="button" onClick={loadMore} disabled={isAppending}>
            {isAppending ? <LoaderCircle className="spin" aria-hidden="true" size={17} /> : null}
            {isAppending ? "Loading…" : "Load more cases"}
          </button>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">{announcement}</p>
    </div>
  );
}
