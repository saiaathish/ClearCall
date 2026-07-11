"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  CaseReport,
  DiscussionResponse,
  PublishedCaseDraft,
  ReportReason,
  UserAnswer,
} from "@/lib/types";
import {
  clearDemoState,
  initialDemoState,
  readDemoState,
  writeDemoState,
  type DemoState,
} from "@/lib/storage";

interface DemoContextValue extends DemoState {
  hydrated: boolean;
  submitAnswer: (answer: UserAnswer) => void;
  toggleSaved: (caseId: string) => boolean;
  addComment: (caseId: string, comment: DiscussionResponse) => void;
  publishDraft: (draft: PublishedCaseDraft) => void;
  reportCase: (input: {
    caseId: string;
    reason: ReportReason;
    details?: string;
  }) => CaseReport | null;
  removeFlaggedCase: (caseId: string) => void;
  restoreFlaggedCase: (caseId: string) => void;
  completeOnboarding: () => void;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(initialDemoState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setState(readDemoState());
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const update = useCallback((producer: (current: DemoState) => DemoState) => {
    setState((current) => {
      const next = producer(current);
      writeDemoState(next);
      return next;
    });
  }, []);

  const submitAnswer = useCallback(
    (answer: UserAnswer) => {
      update((current) => ({
        ...current,
        answers: { ...current.answers, [answer.caseId]: answer },
        currentStreak: current.answers[answer.caseId]
          ? current.currentStreak
          : current.currentStreak + 1,
      }));
    },
    [update],
  );

  const toggleSaved = useCallback(
    (caseId: string) => {
      const willSave = !state.savedCaseIds.includes(caseId);
      update((current) => ({
        ...current,
        savedCaseIds: willSave
          ? [...current.savedCaseIds, caseId]
          : current.savedCaseIds.filter((id) => id !== caseId),
      }));
      return willSave;
    },
    [state.savedCaseIds, update],
  );

  const addComment = useCallback(
    (caseId: string, comment: DiscussionResponse) => {
      update((current) => ({
        ...current,
        temporaryComments: {
          ...current.temporaryComments,
          [caseId]: [...(current.temporaryComments[caseId] ?? []), comment],
        },
      }));
    },
    [update],
  );

  const publishDraft = useCallback(
    (draft: PublishedCaseDraft) => {
      update((current) => ({
        ...current,
        publishedDrafts: [draft, ...current.publishedDrafts],
      }));
    },
    [update],
  );

  const reportCase = useCallback(
    (input: { caseId: string; reason: ReportReason; details?: string }) => {
      if (state.removedCaseIds.includes(input.caseId)) return null;
      const alreadyOpen = state.reports.some(
        (report) => report.caseId === input.caseId && report.status === "open",
      );
      if (alreadyOpen) return null;

      const report: CaseReport = {
        id: `report-${input.caseId}-${Date.now()}`,
        caseId: input.caseId,
        reason: input.reason,
        details: (input.details ?? "").trim().slice(0, 500),
        reportedAt: new Date().toISOString(),
        status: "open",
      };

      update((current) => ({
        ...current,
        reports: [report, ...current.reports],
      }));
      return report;
    },
    [state.removedCaseIds, state.reports, update],
  );

  const removeFlaggedCase = useCallback(
    (caseId: string) => {
      update((current) => ({
        ...current,
        removedCaseIds: current.removedCaseIds.includes(caseId)
          ? current.removedCaseIds
          : [...current.removedCaseIds, caseId],
        reports: current.reports.map((report) =>
          report.caseId === caseId && report.status === "open"
            ? { ...report, status: "removed" as const }
            : report,
        ),
        savedCaseIds: current.savedCaseIds.filter((id) => id !== caseId),
      }));
    },
    [update],
  );

  const restoreFlaggedCase = useCallback(
    (caseId: string) => {
      update((current) => ({
        ...current,
        removedCaseIds: current.removedCaseIds.filter((id) => id !== caseId),
      }));
    },
    [update],
  );

  const resetDemo = useCallback(() => {
    clearDemoState();
    setState(initialDemoState);
  }, []);

  const completeOnboarding = useCallback(() => {
    update((current) => ({ ...current, onboardingComplete: true }));
  }, [update]);

  const value = useMemo(
    () => ({
      ...state,
      hydrated,
      submitAnswer,
      toggleSaved,
      addComment,
      publishDraft,
      reportCase,
      removeFlaggedCase,
      restoreFlaggedCase,
      completeOnboarding,
      resetDemo,
    }),
    [
      state,
      hydrated,
      submitAnswer,
      toggleSaved,
      addComment,
      publishDraft,
      reportCase,
      removeFlaggedCase,
      restoreFlaggedCase,
      completeOnboarding,
      resetDemo,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used within DemoProvider");
  return value;
}
