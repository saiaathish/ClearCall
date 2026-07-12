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
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type {
  CaseReport,
  DiscussionResponse,
  PublishedCaseDraft,
  ReportReason,
  UserAnswer,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  addCommentRemote,
  clearDemoState,
  completeOnboardingRemote,
  emptyGuestState,
  fetchDemoState,
  initialDemoState,
  publishDraftRemote,
  readDemoSessionPreference,
  readDemoState,
  submitAnswerRemote,
  toggleSavedRemote,
  writeDemoSessionPreference,
  writeDemoState,
  type DemoState,
} from "@/lib/storage";
import { persistReputationScore } from "@/lib/reputation";

export type SubmitAnswerResult = "saved" | "auth-required" | "error";

interface DemoContextValue extends DemoState {
  hydrated: boolean;
  user: User | null;
  /** Local Jordan Lee demo session (not a Supabase user). */
  isDemoSession: boolean;
  /** Real account or active local demo. */
  isSignedIn: boolean;
  submitAnswer: (answer: UserAnswer) => Promise<SubmitAnswerResult>;
  toggleSaved: (caseId: string) => boolean;
  addComment: (caseId: string, comment: DiscussionResponse) => void;
  publishDraft: (draft: PublishedCaseDraft, file?: File | null) => Promise<boolean>;
  reportCase: (input: {
    caseId: string;
    reason: ReportReason;
    details?: string;
  }) => CaseReport | null;
  removeFlaggedCase: (caseId: string) => void;
  restoreFlaggedCase: (caseId: string) => void;
  completeOnboarding: () => void;
  resetDemo: () => void;
  enterDemo: () => void;
  signOut: () => Promise<void>;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isDemoSession, setIsDemoSession] = useState(() =>
    typeof window === "undefined" ? true : readDemoSessionPreference(),
  );
  const [state, setState] = useState<DemoState>(() => {
    if (typeof window === "undefined") return initialDemoState;
    return readDemoSessionPreference() ? readDemoState() : emptyGuestState;
  });
  const [hydrated, setHydrated] = useState(false);
  // Keep refs in sync so imperative handlers can read the latest values
  // without depending on stale closures.
  const stateRef = useRef(state);
  const userRef = useRef(user);
  /** Saves toggled while a remote fetch is in flight, keyed by case id. */
  const pendingSavedRef = useRef<Map<string, boolean>>(new Map());
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  /** Persist local demo/guest progress. Signed-in users use Supabase instead. */
  const commitLocalState = useCallback((producer: (current: DemoState) => DemoState) => {
    setState((current) => {
      const next = producer(current);
      if (!userRef.current) writeDemoState(next);
      return next;
    });
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const nextUser = data.session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        setIsDemoSession(false);
        writeDemoSessionPreference(false);
      } else {
        setHydrated(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        const preferDemo = readDemoSessionPreference();
        setIsDemoSession(preferDemo);
        // Restore persisted demo progress instead of wiping saves/answers.
        setState(preferDemo ? readDemoState() : emptyGuestState);
        setHydrated(true);
      } else {
        setIsDemoSession(false);
        writeDemoSessionPreference(false);
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
      setState((current) => {
        let savedCaseIds = [...next.savedCaseIds];
        for (const [caseId, willSave] of pendingSavedRef.current) {
          if (willSave) {
            if (!savedCaseIds.includes(caseId)) savedCaseIds.push(caseId);
          } else {
            savedCaseIds = savedCaseIds.filter((id) => id !== caseId);
          }
        }
        pendingSavedRef.current.clear();
        return {
          ...next,
          savedCaseIds,
          // Reports / removals stay browser-local in this prototype.
          reports: current.reports,
          removedCaseIds: current.removedCaseIds,
        };
      });
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [supabase, user]);

  const isSignedIn = Boolean(user) || isDemoSession;

  const requireAuth = useCallback(() => {
    if (user || isDemoSession) return true;
    router.push("/auth");
    return false;
  }, [isDemoSession, router, user]);

  const submitAnswer = useCallback(
    async (answer: UserAnswer): Promise<SubmitAnswerResult> => {
      if (!requireAuth()) return "auth-required";
      const isNewAnswer = !stateRef.current.answers[answer.caseId];
      const submittedUserId = user?.id;
      if (user) {
        try {
          await submitAnswerRemote(supabase, user.id, answer, isNewAnswer);
        } catch {
          return "error";
        }
      }
      if (submittedUserId && userRef.current?.id !== submittedUserId) return "error";
      commitLocalState((current) => ({
        ...current,
        answers: { ...current.answers, [answer.caseId]: answer },
        currentStreak: isNewAnswer ? current.currentStreak + 1 : current.currentStreak,
      }));
      if (user) void persistReputationScore(supabase);
      return "saved";
    },
    [commitLocalState, requireAuth, supabase, user],
  );

  const toggleSaved = useCallback(
    (caseId: string) => {
      if (!requireAuth()) return false;
      const willSave = !stateRef.current.savedCaseIds.includes(caseId);
      if (userRef.current) pendingSavedRef.current.set(caseId, willSave);
      commitLocalState((current) => ({
        ...current,
        savedCaseIds: willSave
          ? [...current.savedCaseIds, caseId]
          : current.savedCaseIds.filter((id) => id !== caseId),
      }));
      if (user) void toggleSavedRemote(supabase, user.id, caseId, willSave);
      return willSave;
    },
    [commitLocalState, requireAuth, supabase, user],
  );

  const addComment = useCallback(
    (caseId: string, comment: DiscussionResponse) => {
      if (!requireAuth()) return;
      commitLocalState((current) => ({
        ...current,
        temporaryComments: {
          ...current.temporaryComments,
          [caseId]: [...(current.temporaryComments[caseId] ?? []), comment],
        },
      }));
      if (!user) return;
      void addCommentRemote(supabase, user.id, caseId, comment).then((saved) => {
        if (saved) {
          commitLocalState((current) => ({
            ...current,
            temporaryComments: {
              ...current.temporaryComments,
              [caseId]: (current.temporaryComments[caseId] ?? []).map((item) =>
                item.id === comment.id ? saved : item,
              ),
            },
          }));
        }
        return persistReputationScore(supabase);
      });
    },
    [commitLocalState, requireAuth, supabase, user],
  );

  const publishDraft = useCallback(
    async (draft: PublishedCaseDraft, file?: File | null) => {
      if (!requireAuth()) return false;
      if (!user) {
        commitLocalState((current) => ({
          ...current,
          publishedDrafts: [draft, ...current.publishedDrafts],
        }));
        return true;
      }
      try {
        const saved = await publishDraftRemote(supabase, user.id, draft, file ?? null);
        commitLocalState((current) => ({
          ...current,
          publishedDrafts: [saved, ...current.publishedDrafts],
        }));
        return true;
      } catch {
        return false;
      }
    },
    [commitLocalState, requireAuth, supabase, user],
  );

  const completeOnboarding = useCallback(() => {
    if (!requireAuth()) return;
    commitLocalState((current) => ({ ...current, onboardingComplete: true }));
    if (user) void completeOnboardingRemote(supabase, user.id);
  }, [commitLocalState, requireAuth, supabase, user]);

  const reportCase = useCallback(
    (input: { caseId: string; reason: ReportReason; details?: string }) => {
      if (stateRef.current.removedCaseIds.includes(input.caseId)) return null;
      const alreadyOpen = stateRef.current.reports.some(
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

      commitLocalState((current) => ({
        ...current,
        reports: [report, ...current.reports],
      }));
      return report;
    },
    [commitLocalState],
  );

  const removeFlaggedCase = useCallback(
    (caseId: string) => {
      commitLocalState((current) => ({
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
    [commitLocalState],
  );

  const restoreFlaggedCase = useCallback(
    (caseId: string) => {
      commitLocalState((current) => ({
        ...current,
        removedCaseIds: current.removedCaseIds.filter((id) => id !== caseId),
      }));
    },
    [commitLocalState],
  );

  const enterDemo = useCallback(() => {
    writeDemoSessionPreference(true);
    setIsDemoSession(true);
    setState(readDemoState());
    setHydrated(true);
    router.push("/");
  }, [router]);

  const resetDemo = useCallback(() => {
    void supabase.auth.signOut();
    writeDemoSessionPreference(true);
    clearDemoState();
    writeDemoState(initialDemoState);
    setIsDemoSession(true);
    setState(initialDemoState);
    setHydrated(true);
  }, [supabase]);

  const signOut = useCallback(async () => {
    writeDemoSessionPreference(false);
    setIsDemoSession(false);
    setState(emptyGuestState);
    setHydrated(true);
    await supabase.auth.signOut();
    router.push("/");
  }, [router, supabase]);

  const value = useMemo(
    () => ({
      ...state,
      hydrated,
      user,
      isDemoSession,
      isSignedIn,
      submitAnswer,
      toggleSaved,
      addComment,
      publishDraft,
      reportCase,
      removeFlaggedCase,
      restoreFlaggedCase,
      completeOnboarding,
      resetDemo,
      enterDemo,
      signOut,
    }),
    [
      state,
      hydrated,
      user,
      isDemoSession,
      isSignedIn,
      submitAnswer,
      toggleSaved,
      addComment,
      publishDraft,
      reportCase,
      removeFlaggedCase,
      restoreFlaggedCase,
      completeOnboarding,
      resetDemo,
      enterDemo,
      signOut,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used within DemoProvider");
  return value;
}
