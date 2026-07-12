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
  FEED_PRELOAD_AHEAD,
  FEED_SEED_SIZE,
  appendFeedBatch,
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
  return appendFeedBatch(pool, [], { batchSize: FEED_SEED_SIZE });
}

function poolKeyFor(category: CaseCategory | "all", pool: readonly OfficiatingCase[]): string {
  return `${category}::${pool.length}::${pool[0]?.id ?? "empty"}::${pool.at(-1)?.id ?? "empty"}`;
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
  const filteredCasesRef = useRef<readonly OfficiatingCase[]>([]);

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
  filteredCasesRef.current = filteredCases;

  // Reset the mix when the foul filter or available catalog changes.
  // (React-recommended "adjust state while rendering" pattern — not an effect.)
  if (hydrated && boundPoolKey !== poolKey) {
    setBoundPoolKey(poolKey);
    setFeedItems(seedFeed(filteredCases));
  }

  const appendNext = useCallback(() => {
    const pool = filteredCasesRef.current;
    if (pool.length === 0) return;
    setFeedItems((current) => {
      const expanded = appendFeedBatch(pool, current, { batchSize: FEED_BATCH_SIZE });
      getMediaPreloadCache().preload(
        upcomingMediaSrcs(
          expanded,
          Math.max(0, expanded.length - FEED_BATCH_SIZE),
          FEED_PRELOAD_AHEAD,
        ),
      );
      return expanded;
    });
  }, []);

  // Keep filling while the bottom sentinel is near the viewport.
  // Re-observe after each batch so IntersectionObserver re-fires (it often
  // will not when the sentinel stays on-screen after a load).
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || filteredCases.length === 0 || typeof IntersectionObserver === "undefined") return;

    let cancelled = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (cancelled || loadingRef.current) return;
        if (!entries.some((entry) => entry.isIntersecting)) return;

        loadingRef.current = true;
        setIsAppending(true);
        appendNext();

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (cancelled) return;
            loadingRef.current = false;
            setIsAppending(false);
            // Force a fresh intersection check after layout.
            observer.unobserve(sentinel);
            observer.observe(sentinel);
          });
        });
      },
      { rootMargin: "1400px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => {
      cancelled = true;
      loadingRef.current = false;
      observer.disconnect();
    };
  }, [appendNext, filteredCases.length, poolKey]);

  useEffect(() => {
    if (feedItems.length === 0) return;
    getMediaPreloadCache().preload(
      upcomingMediaSrcs(
        feedItems,
        Math.max(0, feedItems.length - FEED_BATCH_SIZE),
        FEED_PRELOAD_AHEAD,
      ),
    );
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
          <p>Keeps scrolling forever — cases reshuffle from the mix as you go.</p>
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
        <span>{feedItems.length} loaded</span>
        <span>{answerList.length}/{cases.length} reviewed</span>
      </div>

      {feedItems.length > 0 ? (
        <ol className="feed-stream" aria-label="Officiating case feed">
          {feedItems.map((item, index) => (
            <li key={item.key}>
              <FeedPostCard
                appearanceKey={item.key}
                scenario={item.scenario}
                priority={index < 2}
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

      <div className="feed-loader" ref={sentinelRef} aria-hidden={filteredCases.length === 0}>
        {filteredCases.length > 0 && isAppending ? (
          <div className="feed-loader__status" aria-live="polite">
            <LoaderCircle className="spin" aria-hidden="true" size={17} />
            <span>Loading…</span>
          </div>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">{announcement}</p>
    </div>
  );
}
