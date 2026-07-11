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
import type { DiscussionResponse, PublishedCaseDraft, UserAnswer } from "@/lib/types";
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
      completeOnboarding,
      resetDemo,
    }),
    [state, hydrated, submitAnswer, toggleSaved, addComment, publishDraft, completeOnboarding, resetDemo],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used within DemoProvider");
  return value;
}
