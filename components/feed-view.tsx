"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Funnel, LoaderCircle, RotateCcw, SquarePlus } from "lucide-react";
import { cases } from "@/data/cases";
import type { CaseCategory } from "@/lib/types";
import { rankPersonalizedCases } from "@/lib/algorithms";
import { useDemo } from "@/context/demo-context";
import { FeedPostCard } from "@/components/feed-post-card";

const BATCH_SIZE = 4;
const categoryOptions = [...new Set(cases.map((scenario) => scenario.category))] as CaseCategory[];

function isCaseCategory(value: string | null): value is CaseCategory {
  return Boolean(value && categoryOptions.includes(value as CaseCategory));
}

export function FeedView() {
  const { answers, hydrated } = useDemo();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("foul");
  const activeCategory: CaseCategory | "all" = isCaseCategory(filterParam) ? filterParam : "all";
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = window.sessionStorage.getItem("clearcall-feed-counts");
      const parsed = stored ? JSON.parse(stored) as unknown : null;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return Object.fromEntries(
        Object.entries(parsed).filter((entry): entry is [string, number] => (
          typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] > 0
        )),
      );
    } catch {
      return {};
    }
  });
  const [isAppending, setIsAppending] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const answerList = useMemo(() => Object.values(answers), [answers]);
  const orderedCases = useMemo(() => {
    const ranked = rankPersonalizedCases(cases, answerList).map((entry) => entry.case);
    const rankedIds = new Set(ranked.map((scenario) => scenario.id));
    return [...ranked, ...cases.filter((scenario) => !rankedIds.has(scenario.id))];
  }, [answerList]);
  const filteredCases = useMemo(
    () => activeCategory === "all"
      ? orderedCases
      : orderedCases.filter((scenario) => scenario.category === activeCategory),
    [activeCategory, orderedCases],
  );
  const visibleCount = Math.min(
    filteredCases.length,
    Math.max(BATCH_SIZE, visibleCounts[activeCategory] ?? BATCH_SIZE),
  );
  const visibleCases = filteredCases.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCases.length;

  const loadMore = useCallback(() => {
    if (loadingRef.current || visibleCount >= filteredCases.length) return;
    loadingRef.current = true;
    setIsAppending(true);

    window.requestAnimationFrame(() => {
      const next = Math.min(filteredCases.length, visibleCount + BATCH_SIZE);
      const added = Math.max(0, next - visibleCount);
      const nextCounts = { ...visibleCounts, [activeCategory]: next };
      setVisibleCounts(nextCounts);
      window.sessionStorage.setItem("clearcall-feed-counts", JSON.stringify(nextCounts));
      setAnnouncement(added > 0 ? `${added} more cases loaded. ${next} shown.` : "All matching cases are shown.");
      setIsAppending(false);
      loadingRef.current = false;
    });
  }, [activeCategory, filteredCases.length, visibleCount, visibleCounts]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "700px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const setCategory = (category: CaseCategory | "all") => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (category === "all") nextParams.delete("foul");
    else nextParams.set("foul", category);
    const query = nextParams.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
    setVisibleCounts((current) => ({ ...current, [category]: BATCH_SIZE }));
    setAnnouncement(
      category === "all"
        ? `${cases.length} seeded cases shown across all foul types.`
        : `Feed filtered to ${category}.`,
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
          <p>Watch → decide → explain. Open a case to make the call.</p>
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
        <span>{filteredCases.length} {filteredCases.length === 1 ? "case" : "cases"}</span>
        <span>{answerList.length}/{cases.length} reviewed</span>
      </div>

      {filteredCases.length > 0 ? (
        <ol className="feed-stream" aria-label="Officiating case feed">
          {visibleCases.map((scenario, index) => (
            <li key={scenario.id}>
              <FeedPostCard scenario={scenario} priority={index === 0} />
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
        {hasMore ? (
          <button className="button button--secondary" type="button" onClick={loadMore} disabled={isAppending}>
            {isAppending ? <LoaderCircle className="spin" aria-hidden="true" size={17} /> : null}
            {isAppending ? "Loading cases…" : "Load more cases"}
          </button>
        ) : filteredCases.length > 0 ? (
          <p>All matching seeded cases are shown.</p>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">{announcement}</p>
    </div>
  );
}
