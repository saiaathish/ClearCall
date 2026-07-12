"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Funnel, LoaderCircle, RotateCcw } from "lucide-react";
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

/** Stable identity for when the feed should reshuffle — not ranking order. */
function poolIdentityFor(category: CaseCategory | "all", removedIds: ReadonlySet<string>): string {
  const removed = [...removedIds].sort().join(",");
  return `${category}::${removed}`;
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
    () =>
      activeCategory === "all"
        ? orderedCases
        : orderedCases.filter((scenario) => scenario.category === activeCategory),
    [activeCategory, orderedCases],
  );
  const poolKey = poolIdentityFor(activeCategory, removedIds);

  useEffect(() => {
    filteredCasesRef.current = filteredCases;
  }, [filteredCases]);

  // Reset only when foul filter or removed-case set changes — not when ranking reorders.
  if (hydrated && boundPoolKey !== poolKey) {
    setBoundPoolKey(poolKey);
    setFeedItems(seedFeed(filteredCases));
  }

  const appendNext = useCallback(() => {
    const pool = filteredCasesRef.current;
    if (pool.length === 0) return false;
    let grew = false;
    setFeedItems((current) => {
      const expanded = appendFeedBatch(pool, current, { batchSize: FEED_BATCH_SIZE });
      grew = expanded.length > current.length;
      if (!grew) return current;
      getMediaPreloadCache().preload(
        upcomingMediaSrcs(
          expanded,
          Math.max(0, expanded.length - FEED_BATCH_SIZE),
          FEED_PRELOAD_AHEAD,
        ),
      );
      return expanded;
    });
    return grew;
  }, []);

  // Infinite scroll: IntersectionObserver + scroll/resize fallback.
  // After a hard refresh the skeleton has no sentinel — wait until it mounts,
  // then keep loading while the loader stays near the viewport. IO alone will
  // not re-fire if the sentinel never left the rootMargin after an append.
  useEffect(() => {
    if (!hydrated || filteredCases.length === 0) return;

    let cancelled = false;
    let settleTimer: number | null = null;
    let attachTimer: number | null = null;
    let observer: IntersectionObserver | null = null;
    let attachTries = 0;

    const nearBottom = (sentinel: HTMLElement) => {
      const rect = sentinel.getBoundingClientRect();
      return rect.top <= window.innerHeight + 2400;
    };

    const finishLoad = (sentinel: HTMLElement) => {
      if (settleTimer != null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        if (cancelled) return;
        loadingRef.current = false;
        setIsAppending(false);
        if (nearBottom(sentinel)) {
          window.requestAnimationFrame(() => {
            if (!cancelled) loadMore(sentinel);
          });
        }
      }, 60);
    };

    const loadMore = (sentinel: HTMLElement) => {
      if (cancelled || loadingRef.current) return;
      if (!nearBottom(sentinel)) return;
      loadingRef.current = true;
      setIsAppending(true);
      if (!appendNext()) {
        loadingRef.current = false;
        setIsAppending(false);
        return;
      }
      finishLoad(sentinel);
    };

    const onScrollOrResize = () => {
      const sentinel = sentinelRef.current;
      if (sentinel) loadMore(sentinel);
    };

    const attach = () => {
      if (cancelled) return;
      const sentinel = sentinelRef.current;
      if (!sentinel) {
        if (attachTries >= 40) return;
        attachTries += 1;
        attachTimer = window.setTimeout(attach, 50);
        return;
      }

      observer =
        typeof IntersectionObserver !== "undefined"
          ? new IntersectionObserver(
              (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) loadMore(sentinel);
              },
              { root: null, rootMargin: "2400px 0px", threshold: 0 },
            )
          : null;

      observer?.observe(sentinel);
      window.addEventListener("scroll", onScrollOrResize, { passive: true });
      document.addEventListener("scroll", onScrollOrResize, { passive: true, capture: true });
      window.addEventListener("resize", onScrollOrResize);
      window.requestAnimationFrame(() => {
        if (!cancelled) loadMore(sentinel);
      });
    };

    attach();

    return () => {
      cancelled = true;
      loadingRef.current = false;
      if (settleTimer != null) window.clearTimeout(settleTimer);
      if (attachTimer != null) window.clearTimeout(attachTimer);
      observer?.disconnect();
      window.removeEventListener("scroll", onScrollOrResize);
      document.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [appendNext, filteredCases.length, hydrated, poolKey]);

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
        ? `${cases.length} curated demo cases across varied foul types.`
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
        {/* Keep a sentinel node so the scroll effect can attach immediately after hydrate. */}
        <div className="feed-loader" ref={sentinelRef} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="feed-page">
      <header className="feed-toolbar">
        <div className="feed-toolbar__title">
          <h1>Feed</h1>
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
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

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
        {filteredCases.length > 0 ? (
          <div className="feed-loader__status" aria-live="polite">
            {isAppending ? (
              <>
                <LoaderCircle className="spin" aria-hidden="true" size={17} />
                <span>Loading more cases…</span>
              </>
            ) : (
              <span>Scroll for more cases</span>
            )}
          </div>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
