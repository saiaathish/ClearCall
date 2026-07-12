"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  addCommentRemote,
  completeOnboardingRemote,
  fetchDemoState,
  initialDemoState,
  publishDraftRemote,
  submitAnswerRemote,
  toggleSavedRemote,
  type DemoState,
} from "@/lib/storage";
import { persistReputationScore } from "@/lib/reputation";

interface DemoContextValue extends DemoState {
  hydrated: boolean;
  user: User | null;
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
  signOut: () => Promise<void>;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<DemoState>(initialDemoState);
  const [hydrated, setHydrated] = useState(false);
  // Keep a ref in sync with state so imperative handlers (toggleSaved) can
  // compute the next value without depending on stale closures.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      if (!data.session?.user) setHydrated(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setState(initialDemoState);
        setHydrated(true);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchDemoState(supabase, user.id).then((next) => {
      if (!active) return;
      setState(next);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [supabase, user]);

  const requireAuth = useCallback(() => {
    if (user) return true;
    router.push("/auth");
    return false;
  }, [router, user]);

  const submitAnswer = useCallback(
    (answer: UserAnswer) => {
      if (!requireAuth() || !user) return;
      const isNewAnswer = !stateRef.current.answers[answer.caseId];
      setState((current) => ({
        ...current,
        answers: { ...current.answers, [answer.caseId]: answer },
        currentStreak: isNewAnswer ? current.currentStreak + 1 : current.currentStreak,
      }));
      void submitAnswerRemote(supabase, user.id, answer, isNewAnswer).then(() =>
        persistReputationScore(supabase),
      );
    },
    [requireAuth, supabase, user],
  );

  const toggleSaved = useCallback(
    (caseId: string) => {
      if (!requireAuth() || !user) return false;
      const willSave = !stateRef.current.savedCaseIds.includes(caseId);
      setState((current) => ({
        ...current,
        savedCaseIds: willSave
          ? [...current.savedCaseIds, caseId]
          : current.savedCaseIds.filter((id) => id !== caseId),
      }));
      void toggleSavedRemote(supabase, user.id, caseId, willSave);
      return willSave;
    },
    [requireAuth, supabase, user],
  );

  const addComment = useCallback(
    (caseId: string, comment: DiscussionResponse) => {
      if (!requireAuth() || !user) return;
      setState((current) => ({
        ...current,
        temporaryComments: {
          ...current.temporaryComments,
          [caseId]: [...(current.temporaryComments[caseId] ?? []), comment],
        },
      }));
      void addCommentRemote(supabase, user.id, caseId, comment).then((saved) => {
        if (saved) setState((current) => ({ ...current, temporaryComments: {
          ...current.temporaryComments,
          [caseId]: (current.temporaryComments[caseId] ?? []).map((item) => item.id === comment.id ? saved : item),
        }}));
        return persistReputationScore(supabase);
      });
    },
    [requireAuth, supabase, user],
  );

  const publishDraft = useCallback(
    async (draft: PublishedCaseDraft, file?: File | null) => {
      if (!requireAuth() || !user) return false;
      try {
        const saved = await publishDraftRemote(supabase, user.id, draft, file ?? null);
        setState((current) => ({
          ...current,
          publishedDrafts: [saved, ...current.publishedDrafts],
        }));
        return true;
      } catch {
        return false;
      }
    },
    [requireAuth, supabase, user],
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
    void supabase.auth.signOut();
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
  }, [router, supabase]);

  const value = useMemo(
    () => ({
      ...state,
      hydrated,
      user,
      submitAnswer,
      toggleSaved,
      addComment,
      publishDraft,
      reportCase,
      removeFlaggedCase,
      restoreFlaggedCase,
      completeOnboarding,
      resetDemo,
      signOut,
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
