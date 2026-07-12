"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookmarkMinus,
  BookmarkX,
  Grid2X2,
  List,
  Search,
  SearchX,
} from "lucide-react";
import { getStatusLabel, StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast-provider";
import { useDemo } from "@/context/demo-context";
import { cases } from "@/data/cases";
import type { Difficulty, OfficiatingCase, ScenarioStatus } from "@/lib/types";

type ViewMode = "grid" | "list";

const difficultyOptions: readonly Difficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
];

const statusOptions: readonly ScenarioStatus[] = [
  "VERIFIED_RULING",
  "EXPERT_CONSENSUS",
  "OPEN_DISCUSSION",
];

const categoryOptions = Array.from(new Set(cases.map((item) => item.category))).sort(
  (left, right) => left.localeCompare(right),
);

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function SavedSkeleton() {
  return (
    <div className="page-shell" aria-busy="true">
      <header className="page-header">
        <div className="page-header__copy">
          <h1 className="page-title">Saved cases</h1>
        </div>
      </header>

      <span className="sr-only" role="status">
        Loading saved cases.
      </span>
      <div className="saved-toolbar" aria-hidden="true">
        <div className="loading-skeleton" style={{ minHeight: 46 }} />
        <div className="loading-skeleton" style={{ minHeight: 46 }} />
        <div className="loading-skeleton" style={{ minHeight: 46 }} />
        <div className="loading-skeleton" style={{ minHeight: 46 }} />
        <div className="loading-skeleton" style={{ minHeight: 46, minWidth: 84 }} />
      </div>
      <div className="saved-grid" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div className="saved-case-card" key={item}>
            <div className="saved-case-card__poster loading-skeleton" />
            <div className="saved-case-card__body">
              <div className="loading-skeleton" style={{ height: 20, width: "42%" }} />
              <div className="loading-skeleton" style={{ height: 28, width: "82%" }} />
              <div className="loading-skeleton" style={{ height: 34 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SavedCaseCard({
  item,
  onRemove,
}: {
  item: OfficiatingCase;
  onRemove: (item: OfficiatingCase) => void;
}) {
  return (
    <article className="saved-case-card">
      <div className="saved-case-card__poster" aria-hidden="true" />
      <div className="saved-case-card__body">
        <div className="meta-row">
          <StatusBadge status={item.scenarioStatus} />
          {item.reviewState === "DEMO_REVIEW_REQUIRED" && (
            <span className="meta-chip">Demo review required</span>
          )}
          <span className="meta-chip">{titleCase(item.difficulty)}</span>
          <span className="meta-chip">{item.category}</span>
        </div>

        <div>
          <h2>{item.title}</h2>
          <p>{item.prompt}</p>
        </div>

        <footer className="saved-case-card__footer">
          <Link
            className="text-link"
            href={`/case/${item.id}`}
            aria-label={`Continue training with ${item.title}`}
          >
            Continue training <ArrowRight aria-hidden="true" size={15} />
          </Link>
          <button
            className="icon-button icon-button--small"
            id={`remove-saved-${item.id}`}
            type="button"
            onClick={() => onRemove(item)}
            aria-label={`Remove ${item.title} from saved cases`}
            title="Remove from saved"
          >
            <BookmarkMinus aria-hidden="true" size={17} />
          </button>
        </footer>
      </div>
    </article>
  );
}

export function SavedView() {
  const { hydrated, savedCaseIds, removedCaseIds, toggleSaved } = useDemo();
  const { showToast } = useToast();
  const [view, setView] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState<"" | Difficulty>("");
  const [status, setStatus] = useState<"" | ScenarioStatus>("");

  const savedCases = useMemo(() => {
    const removedIds = new Set(removedCaseIds);
    const byId = new Map(cases.map((item) => [item.id, item]));
    // Resolve in save order (newest first) so a just-saved case is visible
    // at the top of the Saved tab instead of catalog order.
    return [...savedCaseIds]
      .reverse()
      .filter((id) => !removedIds.has(id))
      .map((id) => byId.get(id))
      .filter((item): item is (typeof cases)[number] => Boolean(item));
  }, [removedCaseIds, savedCaseIds]);

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return savedCases.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          item.title,
          item.prompt,
          item.description,
          item.category,
          item.competitionLevel,
          item.ruleReference,
        ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));

      return (
        matchesQuery &&
        (category === "" || item.category === category) &&
        (difficulty === "" || item.difficulty === difficulty) &&
        (status === "" || item.scenarioStatus === status)
      );
    });
  }, [savedCases, query, category, difficulty, status]);

  if (!hydrated) return <SavedSkeleton />;

  const hasActiveFilters =
    query.trim().length > 0 || category !== "" || difficulty !== "" || status !== "";

  function clearFilters() {
    setQuery("");
    setCategory("");
    setDifficulty("");
    setStatus("");
  }

  function removeSavedCase(item: OfficiatingCase) {
    const removedIndex = filteredCases.findIndex((candidate) => candidate.id === item.id);
    const remainingCases = filteredCases.filter((candidate) => candidate.id !== item.id);
    const nextCase = remainingCases[Math.min(removedIndex, remainingCases.length - 1)];
    const focusTargetId = nextCase
      ? `remove-saved-${nextCase.id}`
      : savedCases.length === 1
        ? "saved-empty-title"
        : "saved-filter-empty-title";

    toggleSaved(item.id);
    showToast(`${item.title} was removed from saved cases.`, "info");
    window.requestAnimationFrame(() => document.getElementById(focusTargetId)?.focus());
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header__copy">
          <h1 className="page-title">Saved cases</h1>
        </div>
      </header>

      <section className="saved-toolbar" aria-label="Saved case controls">
        <div className="search-field">
          <label className="sr-only" htmlFor="saved-search">
            Search saved cases
          </label>
          <Search aria-hidden="true" size={17} />
          <input
            className="input"
            id="saved-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search saved cases"
          />
        </div>

        <div>
          <label className="sr-only" htmlFor="saved-category">
            Filter by category
          </label>
          <select
            className="select"
            id="saved-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {categoryOptions.map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="sr-only" htmlFor="saved-difficulty">
            Filter by difficulty
          </label>
          <select
            className="select"
            id="saved-difficulty"
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as "" | Difficulty)
            }
          >
            <option value="">All difficulties</option>
            {difficultyOptions.map((option) => (
              <option value={option} key={option}>
                {titleCase(option)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="sr-only" htmlFor="saved-status">
            Filter by decision status
          </label>
          <select
            className="select"
            id="saved-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as "" | ScenarioStatus)}
          >
            <option value="">All statuses</option>
            {statusOptions.map((option) => (
              <option value={option} key={option}>
                {getStatusLabel(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="view-toggle" role="group" aria-label="Saved case view">
          <button
            type="button"
            data-active={view === "grid" ? "" : undefined}
            aria-pressed={view === "grid"}
            aria-label="Show saved cases as a grid"
            title="Grid view"
            onClick={() => setView("grid")}
          >
            <Grid2X2 aria-hidden="true" size={17} />
          </button>
          <button
            type="button"
            data-active={view === "list" ? "" : undefined}
            aria-pressed={view === "list"}
            aria-label="Show saved cases as a list"
            title="List view"
            onClick={() => setView("list")}
          >
            <List aria-hidden="true" size={18} />
          </button>
        </div>
      </section>

      {savedCases.length === 0 ? (
        <section className="empty-state" aria-labelledby="saved-empty-title">
          <div>
            <span className="empty-state__icon">
              <BookmarkX aria-hidden="true" size={24} />
            </span>
            <h2 id="saved-empty-title" tabIndex={-1}>
              No saved cases yet
            </h2>
            <p>
              Save a case from the feed to build a review queue.
            </p>
            <Link className="button" href="/">
              Browse training cases <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </section>
      ) : filteredCases.length === 0 ? (
        <section className="empty-state" aria-labelledby="saved-filter-empty-title">
          <div>
            <span className="empty-state__icon">
              <SearchX aria-hidden="true" size={24} />
            </span>
            <h2 id="saved-filter-empty-title" tabIndex={-1}>
              No cases match these filters
            </h2>
            <p>
              Try a broader search or clear the filters. Your saved cases have not been
              removed.
            </p>
            {hasActiveFilters && (
              <button className="button button--secondary" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        </section>
      ) : (
        <section
          className="saved-grid"
          data-view={view}
          aria-label={`${filteredCases.length} saved ${
            filteredCases.length === 1 ? "case" : "cases"
          }`}
        >
          {filteredCases.map((item) => (
            <SavedCaseCard item={item} onRemove={removeSavedCase} key={item.id} />
          ))}
        </section>
      )}
    </div>
  );
}
