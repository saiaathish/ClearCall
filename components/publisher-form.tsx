"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileVideo,
  Film,
  Plus,
  RotateCcw,
  Send,
  ShieldAlert,
  Trash2,
  Upload,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { useDemo } from "@/context/demo-context";
import type {
  CaseCategory,
  Difficulty,
  PublishedCaseDraft,
  ScenarioStatus,
  SourceType,
} from "@/lib/types";

interface AnswerDraft {
  uid: string;
  label: string;
}

interface FactorDraft {
  uid: string;
  key: string;
  label: string;
  value: string;
  explanation: string;
  supportsRecommendation: boolean;
}

interface PublisherFormState {
  clipStartTime: string;
  clipEndTime: string;
  posterFrameLabel: string;
  sourceAttribution: string;
  sourceType: SourceType;
  permissionConfirmed: boolean;
  sport: "soccer";
  title: string;
  description: string;
  competitionLevel: string;
  ruleset: string;
  rulesetVersion: string;
  category: CaseCategory;
  difficulty: Difficulty;
  originalDecision: string;
  prompt: string;
  answers: AnswerDraft[];
  recommendedAnswerUid: string;
  scenarioStatus: ScenarioStatus;
  factors: FactorDraft[];
  criticalFactorUid: string;
  rulePath: string[];
  ruleReference: string;
  expertExplanation: string;
}

type ValidationErrors = Record<string, string>;

interface PreviewModel {
  title: string;
  prompt: string;
  description: string;
  competitionLevel: string;
  category: string;
  difficulty: string;
  rulesetLabel: string;
  originalDecision: string;
  statusLabel: string;
  statusClassName: string;
  answers: readonly string[];
  recommendedAnswer: string;
  rulePath: readonly string[];
  ruleReference: string;
  expertExplanation: string;
  criticalFactor: string;
  clipLabel: string;
  posterFrameLabel: string;
  isPending: boolean;
}

const CATEGORY_OPTIONS: readonly CaseCategory[] = [
  "Serious foul play",
  "Handball",
  "Offside interference",
  "Denial of an obvious goal-scoring opportunity",
  "Advantage",
  "Simulation",
  "Goalkeeper handling",
];

const SOURCE_OPTIONS: readonly { value: SourceType; label: string }[] = [
  { value: "team-recorded", label: "Team recorded" },
  { value: "used-with-permission", label: "Used with permission" },
  { value: "open-license", label: "Openly licensed" },
  { value: "external-embed", label: "External embed" },
];

const STATUS_OPTIONS: readonly { value: ScenarioStatus; label: string }[] = [
  { value: "VERIFIED_RULING", label: "Verified ruling" },
  { value: "EXPERT_CONSENSUS", label: "Expert consensus" },
  { value: "OPEN_DISCUSSION", label: "Open discussion" },
];

const STATUS_LABELS: Record<ScenarioStatus, string> = {
  VERIFIED_RULING: "Verified ruling",
  EXPERT_CONSENSUS: "Expert consensus",
  OPEN_DISCUSSION: "Open discussion",
};

const STATUS_CLASSES: Record<ScenarioStatus, string> = {
  VERIFIED_RULING: "status-badge status-badge--verified",
  EXPERT_CONSENSUS: "status-badge status-badge--consensus",
  OPEN_DISCUSSION: "status-badge status-badge--open",
};

function createInitialForm(): PublisherFormState {
  return {
    clipStartTime: "0",
    clipEndTime: "",
    posterFrameLabel: "Poster frame selected during expert review",
    sourceAttribution: "",
    sourceType: "team-recorded",
    permissionConfirmed: false,
    sport: "soccer",
    title: "",
    description: "",
    competitionLevel: "",
    ruleset: "IFAB Laws of the Game",
    rulesetVersion: "2025/26",
    category: "Serious foul play",
    difficulty: "intermediate",
    originalDecision: "",
    prompt: "",
    answers: [
      { uid: "answer-1", label: "" },
      { uid: "answer-2", label: "" },
      { uid: "answer-3", label: "" },
    ],
    recommendedAnswerUid: "",
    scenarioStatus: "EXPERT_CONSENSUS",
    factors: [
      {
        uid: "factor-1",
        key: "",
        label: "",
        value: "",
        explanation: "",
        supportsRecommendation: true,
      },
    ],
    criticalFactorUid: "",
    rulePath: [""],
    ruleReference: "",
    expertExplanation: "",
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isSupportedVideo(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|m4v|mov|ogv|webm)$/i.test(file.name);
}

function validateForm(
  form: PublisherFormState,
  selectedFile: File | null,
  clipDuration: number | null,
  fileError: string,
): ValidationErrors {
  const errors: ValidationErrors = {};
  const add = (id: string, message: string) => {
    if (!errors[id]) errors[id] = message;
  };

  if (fileError) add("clip-file", fileError);
  else if (!selectedFile) add("clip-file", "Choose a local video clip to preview.");

  const start = Number(form.clipStartTime);
  const end = Number(form.clipEndTime);
  if (form.clipStartTime.trim() === "" || !Number.isFinite(start) || start < 0) {
    add("clip-start-time", "Enter a start time of 0 seconds or later.");
  }
  if (form.clipEndTime.trim() === "" || !Number.isFinite(end) || end <= 0) {
    add("clip-end-time", "Enter an end time greater than 0 seconds.");
  } else if (Number.isFinite(start) && end <= start) {
    add("clip-end-time", "End time must be later than start time.");
  } else if (clipDuration !== null && end > clipDuration + 0.05) {
    add("clip-end-time", `End time must be within the ${clipDuration.toFixed(1)} second clip.`);
  }
  if (clipDuration !== null && Number.isFinite(start) && start >= clipDuration) {
    add("clip-start-time", `Start time must be before the ${clipDuration.toFixed(1)} second clip ends.`);
  }
  if (!form.posterFrameLabel.trim()) {
    add("poster-frame-label", "Describe the poster-frame placeholder.");
  }
  if (!form.sourceAttribution.trim()) {
    add("source-attribution", "Add a source or rights-holder attribution.");
  }
  if (!form.permissionConfirmed) {
    add("permission-confirmed", "Confirm that ClearCall may use this clip in the demo.");
  }

  if (!form.title.trim()) add("case-title", "Add a concise case title.");
  if (!form.description.trim()) add("case-description", "Describe the incident context.");
  if (!form.competitionLevel.trim()) {
    add("competition-level", "Add the competition or officiating level.");
  }
  if (!form.ruleset.trim()) add("ruleset", "Add the governing ruleset.");
  if (!form.rulesetVersion.trim()) add("ruleset-version", "Add the ruleset version.");
  if (!form.originalDecision.trim()) {
    add("original-decision", "Add the original on-field decision.");
  }
  if (!form.prompt.trim()) add("case-prompt", "Write the decision question learners will answer.");

  if (form.answers.length < 3 || form.answers.length > 5) {
    add("answer-options", "Provide between three and five answer choices.");
  }
  const answerLabels = new Set<string>();
  form.answers.forEach((answer, index) => {
    const value = answer.label.trim();
    if (!value) add(`answer-label-${answer.uid}`, `Add a label for answer ${index + 1}.`);
    const normalized = value.toLocaleLowerCase();
    if (value && answerLabels.has(normalized)) {
      add(`answer-label-${answer.uid}`, "Each answer choice must be distinct.");
    }
    answerLabels.add(normalized);
  });
  if (!form.recommendedAnswerUid) {
    add("recommended-answer", "Choose the recommended decision.");
  } else if (!form.answers.some((answer) => answer.uid === form.recommendedAnswerUid)) {
    add("recommended-answer", "Choose a recommendation that is still in the answer list.");
  }

  if (form.factors.length === 0) add("reasoning-factors", "Add at least one reasoning factor.");
  const factorKeys = new Set<string>();
  form.factors.forEach((factor, index) => {
    if (!factor.key.trim()) add(`factor-key-${factor.uid}`, `Add a stable key for factor ${index + 1}.`);
    if (!factor.label.trim()) add(`factor-label-${factor.uid}`, `Add a label for factor ${index + 1}.`);
    if (!factor.value.trim()) add(`factor-value-${factor.uid}`, `Add an observed value for factor ${index + 1}.`);
    if (!factor.explanation.trim()) {
      add(`factor-explanation-${factor.uid}`, `Explain how factor ${index + 1} affects the decision.`);
    }
    const normalized = factor.key.trim().toLocaleLowerCase();
    if (normalized && factorKeys.has(normalized)) {
      add(`factor-key-${factor.uid}`, "Factor keys must be unique.");
    }
    factorKeys.add(normalized);
  });
  if (!form.criticalFactorUid) {
    add("critical-factor", "Choose the factor that most clearly separates the outcomes.");
  } else if (!form.factors.some((factor) => factor.uid === form.criticalFactorUid)) {
    add("critical-factor", "Choose a critical factor that is still in the factor list.");
  }
  form.rulePath.forEach((segment, index) => {
    if (!segment.trim()) add(`rule-path-${index}`, `Add a label for rule-path step ${index + 1}.`);
  });
  if (!form.ruleReference.trim()) add("rule-reference", "Add a specific rule citation.");
  if (!form.expertExplanation.trim()) {
    add("expert-explanation", "Add the short explanation reviewers should verify.");
  }

  return errors;
}

function FieldError({ fieldId, message }: { fieldId: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="field-error" id={`${fieldId}-error`}>
      <AlertCircle aria-hidden="true" size={14} />
      <span>{message}</span>
    </p>
  );
}

function describedBy(fieldId: string, errors: ValidationErrors, hintId?: string): string | undefined {
  return [hintId, errors[fieldId] ? `${fieldId}-error` : null].filter(Boolean).join(" ") || undefined;
}

function SectionHeader({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="form-section__header">
      <span className="form-section__number" aria-hidden="true">
        {number}
      </span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="form-section" aria-labelledby={`publish-section-${number}`}>
      <div id={`publish-section-${number}`}>
        <SectionHeader number={number} title={title} description={description} />
      </div>
      {children}
    </section>
  );
}

function CasePreview({ model, id = "case-live-preview" }: { model: PreviewModel; id?: string }) {
  return (
    <aside className="publish-preview" aria-labelledby={`${id}-heading`} id={id}>
      <div>
        <p className="eyebrow">{model.isPending ? "Submitted draft" : "Live preview"}</p>
        <h2 className="section-title" id={`${id}-heading`}>
          {model.isPending ? "Case awaiting review" : "Learner-facing case"}
        </h2>
        <p className="section-description">
          {model.isPending
            ? "This is the browser-local record that was submitted."
            : "Updates as you complete the form; blank content stays visibly marked."}
        </p>
      </div>

      <article className="preview-card">
        <div className="preview-card__stage">
          <div className="case-media__field" aria-hidden="true" />
          <div className="case-media__topline">
            <span className="meta-chip">Soccer</span>
            <span className="meta-chip">{model.clipLabel}</span>
          </div>
          <div className="case-media__placeholder">
            <span className="case-media__placeholder-icon" aria-hidden="true">
              <Film size={22} />
            </span>
            <strong>{model.posterFrameLabel || "Poster-frame placeholder"}</strong>
            <span>Local clip content is never stored in this preview record.</span>
          </div>
        </div>

        <div className="preview-card__body">
          <div className="meta-row">
            <span className={model.statusClassName}>{model.statusLabel}</span>
            <span className="meta-chip">{model.category || "Category"}</span>
            <span className="meta-chip">{model.difficulty || "Difficulty"}</span>
          </div>
          <h2>{model.title || "Untitled case"}</h2>
          <p>{model.prompt || "Your learner-facing decision question will appear here."}</p>
          <p>{model.description || "Incident context has not been added yet."}</p>
          <div className="meta-row">
            <span className="meta-chip">{model.competitionLevel || "Competition level"}</span>
            <span className="meta-chip">{model.rulesetLabel || "Ruleset"}</span>
          </div>
          <p>
            <strong>Original decision:</strong> {model.originalDecision || "Not added"}
          </p>

          <div className="answer-builder" aria-label="Answer choices preview">
            {model.answers.length > 0 ? (
              model.answers.map((answer, index) => {
                const isRecommended = Boolean(model.recommendedAnswer) && model.recommendedAnswer === answer;

                return (
                  <div className="file-summary" key={`${answer}-${index}`}>
                    <span>
                      <strong>{answer || `Answer ${index + 1}`}</strong>
                      <span>{isRecommended ? "Recommended decision" : "Answer option"}</span>
                    </span>
                    {isRecommended ? <Check aria-label="Recommended" size={16} /> : null}
                  </div>
                );
              })
            ) : (
              <p>No answer choices yet.</p>
            )}
          </div>

          <hr className="divider" />
          <p>
            <strong>Rule path:</strong>{" "}
            {model.rulePath.filter(Boolean).join(" → ") || "Not added"}
          </p>
          <p>
            <strong>Citation:</strong> {model.ruleReference || "Not added"}
          </p>
          <p>
            <strong>Critical factor:</strong> {model.criticalFactor || "Not selected"}
          </p>
          <p>{model.expertExplanation || "The review explanation will appear here."}</p>
        </div>
      </article>

      <div className="permission-notice">
        <ShieldAlert aria-hidden="true" size={17} />
        <span>
          Preview only. It is not an official ruling and does not indicate that creator credentials,
          clip rights, or expert review have been verified.
        </span>
      </div>
    </aside>
  );
}

function livePreviewModel(form: PublisherFormState, selectedFile: File | null): PreviewModel {
  const recommended = form.answers.find((answer) => answer.uid === form.recommendedAnswerUid)?.label ?? "";
  const critical = form.factors.find((factor) => factor.uid === form.criticalFactorUid);
  return {
    title: form.title,
    prompt: form.prompt,
    description: form.description,
    competitionLevel: form.competitionLevel,
    category: form.category,
    difficulty: form.difficulty,
    rulesetLabel: [form.ruleset, form.rulesetVersion].filter(Boolean).join(" · "),
    originalDecision: form.originalDecision,
    statusLabel: STATUS_LABELS[form.scenarioStatus],
    statusClassName: STATUS_CLASSES[form.scenarioStatus],
    answers: form.answers.map((answer) => answer.label),
    recommendedAnswer: recommended,
    rulePath: form.rulePath,
    ruleReference: form.ruleReference,
    expertExplanation: form.expertExplanation,
    criticalFactor: critical ? critical.label || critical.key : "",
    clipLabel: selectedFile ? selectedFile.name : "No local clip",
    posterFrameLabel: form.posterFrameLabel,
    isPending: false,
  };
}

function submittedPreviewModel(draft: PublishedCaseDraft): PreviewModel {
  const recommended = draft.answerOptions.find((answer) => answer.id === draft.recommendedDecision)?.label ?? "";
  const critical = draft.factors.find((factor) => factor.key === draft.criticalFactor);
  return {
    title: draft.title,
    prompt: draft.prompt,
    description: draft.description,
    competitionLevel: draft.competitionLevel,
    category: draft.category,
    difficulty: draft.difficulty,
    rulesetLabel: `${draft.ruleset} · ${draft.rulesetVersion}`,
    originalDecision: draft.originalDecision,
    statusLabel: "Pending expert review",
    statusClassName: "status-badge status-badge--pending",
    answers: draft.answerOptions.map((answer) => answer.label),
    recommendedAnswer: recommended,
    rulePath: draft.rulePath,
    ruleReference: draft.ruleReference,
    expertExplanation: draft.expertExplanation,
    criticalFactor: critical?.label ?? draft.criticalFactor,
    clipLabel: draft.clipFileName ?? "Local clip metadata",
    posterFrameLabel: draft.posterFrameLabel,
    isPending: true,
  };
}

export function PublisherForm() {
  const { hydrated, publishDraft } = useDemo();
  const { showToast } = useToast();
  const [form, setForm] = useState<PublisherFormState>(createInitialForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clipDuration, setClipDuration] = useState<number | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const [submittedDraft, setSubmittedDraft] = useState<PublishedCaseDraft | null>(null);
  const answerSequence = useRef(4);
  const factorSequence = useRef(2);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const validationSummaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function revalidate(nextForm: PublisherFormState, nextFile = selectedFile, nextFileError = fileError) {
    if (submissionAttempted) {
      setErrors(validateForm(nextForm, nextFile, clipDuration, nextFileError));
    }
  }

  function updateField<Key extends keyof PublisherFormState>(
    key: Key,
    value: PublisherFormState[Key],
  ) {
    const next = { ...form, [key]: value };
    setForm(next);
    revalidate(next);
  }

  function releasePreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }

  function clearSelectedFile(shouldRevalidate = true) {
    releasePreviewUrl();
    setSelectedFile(null);
    setClipDuration(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (shouldRevalidate && submissionAttempted) {
      setErrors(validateForm(form, null, null, ""));
    }
  }

  function chooseFile(file: File) {
    if (!isSupportedVideo(file)) {
      clearSelectedFile(false);
      const message = "Choose a video file such as MP4, WebM, MOV, M4V, or OGV.";
      setFileError(message);
      if (submissionAttempted) setErrors(validateForm(form, null, null, message));
      return;
    }

    releasePreviewUrl();
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    setClipDuration(null);
    setFileError("");
    if (submissionAttempted) setErrors(validateForm(form, file, null, ""));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) chooseFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) chooseFile(file);
  }

  function handleLoadedMetadata(event: React.SyntheticEvent<HTMLVideoElement>) {
    const duration = event.currentTarget.duration;
    if (!Number.isFinite(duration)) return;
    setClipDuration(duration);
    if (!form.clipEndTime.trim()) {
      const next = { ...form, clipEndTime: Math.min(duration, 15).toFixed(1) };
      setForm(next);
      if (submissionAttempted) setErrors(validateForm(next, selectedFile, duration, fileError));
    } else if (submissionAttempted) {
      setErrors(validateForm(form, selectedFile, duration, fileError));
    }
  }

  function updateAnswer(uid: string, label: string) {
    updateField(
      "answers",
      form.answers.map((answer) => (answer.uid === uid ? { ...answer, label } : answer)),
    );
  }

  function addAnswer() {
    if (form.answers.length >= 5) return;
    updateField("answers", [
      ...form.answers,
      { uid: `answer-${answerSequence.current++}`, label: "" },
    ]);
  }

  function removeAnswer(uid: string) {
    if (form.answers.length <= 3) return;
    const answers = form.answers.filter((answer) => answer.uid !== uid);
    const next = {
      ...form,
      answers,
      recommendedAnswerUid:
        form.recommendedAnswerUid === uid ? "" : form.recommendedAnswerUid,
    };
    setForm(next);
    revalidate(next);
  }

  function updateFactor(uid: string, patch: Partial<FactorDraft>) {
    updateField(
      "factors",
      form.factors.map((factor) => (factor.uid === uid ? { ...factor, ...patch } : factor)),
    );
  }

  function addFactor() {
    updateField("factors", [
      ...form.factors,
      {
        uid: `factor-${factorSequence.current++}`,
        key: "",
        label: "",
        value: "",
        explanation: "",
        supportsRecommendation: true,
      },
    ]);
  }

  function removeFactor(uid: string) {
    if (form.factors.length <= 1) return;
    const factors = form.factors.filter((factor) => factor.uid !== uid);
    const next = {
      ...form,
      factors,
      criticalFactorUid: form.criticalFactorUid === uid ? "" : form.criticalFactorUid,
    };
    setForm(next);
    revalidate(next);
  }

  function updateRulePath(index: number, value: string) {
    updateField(
      "rulePath",
      form.rulePath.map((segment, segmentIndex) => (segmentIndex === index ? value : segment)),
    );
  }

  function removeRulePath(index: number) {
    if (form.rulePath.length <= 1) return;
    updateField(
      "rulePath",
      form.rulePath.filter((_, segmentIndex) => segmentIndex !== index),
    );
  }

  function handleValidationLink(event: React.MouseEvent<HTMLAnchorElement>, fieldId: string) {
    event.preventDefault();
    const target = document.getElementById(fieldId);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus({ preventScroll: true });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionAttempted(true);
    const nextErrors = validateForm(form, selectedFile, clipDuration, fileError);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !selectedFile) {
      window.requestAnimationFrame(() => validationSummaryRef.current?.focus());
      return;
    }

    const answerOptions = form.answers.map((answer, index) => {
      const label = answer.label.trim();
      return {
        id: `option-${index + 1}`,
        label,
        shortLabel: label,
        description: label,
      };
    });
    const recommendedIndex = form.answers.findIndex(
      (answer) => answer.uid === form.recommendedAnswerUid,
    );
    const criticalFactor = form.factors.find(
      (factor) => factor.uid === form.criticalFactorUid,
    );

    const draft: PublishedCaseDraft = {
      id: `draft-${Date.now()}`,
      clipFileName: selectedFile.name,
      clipFileSize: selectedFile.size,
      clipFileType: selectedFile.type || "video/unknown",
      clipStartTime: form.clipStartTime.trim(),
      clipEndTime: form.clipEndTime.trim(),
      posterFrameLabel: form.posterFrameLabel.trim(),
      title: form.title.trim(),
      prompt: form.prompt.trim(),
      description: form.description.trim(),
      competitionLevel: form.competitionLevel.trim(),
      difficulty: form.difficulty,
      category: form.category,
      originalDecision: form.originalDecision.trim(),
      scenarioStatus: form.scenarioStatus,
      answerOptions,
      recommendedDecision: `option-${recommendedIndex + 1}`,
      factors: form.factors.map((factor) => ({
        key: factor.key.trim(),
        label: factor.label.trim(),
        value: factor.value.trim(),
        supportsRecommendation: factor.supportsRecommendation,
        explanation: factor.explanation.trim(),
      })),
      criticalFactor: criticalFactor?.key.trim() ?? "",
      rulePath: form.rulePath.map((segment) => segment.trim()),
      ruleReference: form.ruleReference.trim(),
      expertExplanation: form.expertExplanation.trim(),
      ruleset: form.ruleset.trim(),
      rulesetVersion: form.rulesetVersion.trim(),
      sourceType: form.sourceType,
      sourceAttribution: form.sourceAttribution.trim(),
      permissionStatus: "confirmed",
      permissionConfirmed: true,
      createdAt: new Date().toISOString(),
      status: "draft",
      reviewStatus: "PENDING_EXPERT_REVIEW",
    };

    publishDraft(draft);
    setSubmittedDraft(draft);
    clearSelectedFile(false);
    showToast("Case added to this demo session for expert review.", "success");
    window.setTimeout(() => successRef.current?.focus(), 0);
  }

  function startAnotherDraft() {
    clearSelectedFile(false);
    answerSequence.current = 4;
    factorSequence.current = 2;
    setForm(createInitialForm());
    setErrors({});
    setSubmissionAttempted(false);
    setSubmittedDraft(null);
    window.setTimeout(() => fileInputRef.current?.focus(), 0);
  }

  if (submittedDraft) {
    return (
      <div className="publish-layout">
        <section
          className="success-state"
          aria-labelledby="publish-success-title"
          ref={successRef}
          tabIndex={-1}
        >
          <span className="success-state__icon" aria-hidden="true">
            <CheckCircle2 size={26} />
          </span>
          <span className="status-badge status-badge--pending">Pending expert review</span>
          <h2 id="publish-success-title">Draft submitted to the demo review queue</h2>
          <p>
            The structured case and clip metadata are stored in this browser&apos;s ClearCall demo
            state. The video file and its temporary preview URL were discarded and were not
            uploaded.
          </p>
          <div className="permission-notice">
            <ShieldAlert aria-hidden="true" size={18} />
            <span>
              No public publishing, credential check, rights verification, moderation, or expert
              review happened. Those workflows require production services and qualified reviewers.
            </span>
          </div>
          <div className="button-row">
            <a className="button" href="#submitted-case-preview">
              <FileVideo aria-hidden="true" size={17} />
              View submitted case
            </a>
            <button className="button button--secondary" type="button" onClick={startAnotherDraft}>
              <RotateCcw aria-hidden="true" size={17} />
              Create another draft
            </button>
          </div>
        </section>
        <CasePreview model={submittedPreviewModel(submittedDraft)} id="submitted-case-preview" />
      </div>
    );
  }

  return (
    <div className="publish-layout">
      <form className="publisher-form" noValidate onSubmit={handleSubmit}>
        <FormSection
          number="01"
          title="Clip and rights"
          description="Preview a local clip, trim the teaching moment, and document its source."
        >
          <label className="field-label" htmlFor="clip-file">
            Local video <span aria-hidden="true">*</span>
          </label>
          <div
            className="upload-zone"
            data-dragging={dragging || undefined}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={handleDrop}
          >
            <div>
              <span className="upload-zone__icon" aria-hidden="true">
                <Upload size={22} />
              </span>
              <strong>Drop one video here or choose it below</strong>
              <p id="clip-file-hint">
                MP4, WebM, MOV, M4V, or OGV. The file stays in this tab and is not persisted.
              </p>
              <input
                accept="video/*,.mov,.m4v,.ogv"
                aria-describedby={describedBy("clip-file", errors, "clip-file-hint")}
                aria-invalid={Boolean(errors["clip-file"])}
                className="input"
                id="clip-file"
                onChange={handleFileChange}
                ref={fileInputRef}
                required
                type="file"
              />
            </div>
          </div>
          <FieldError fieldId="clip-file" message={errors["clip-file"]} />

          {selectedFile ? (
            <>
              <div className="file-summary">
                <span>
                  <strong>{selectedFile.name}</strong>
                  <span>
                    {formatBytes(selectedFile.size)}
                    {clipDuration !== null ? ` · ${clipDuration.toFixed(1)} seconds` : " · Reading duration…"}
                  </span>
                </span>
                <button
                  aria-label={`Remove ${selectedFile.name}`}
                  className="icon-button icon-button--small"
                  onClick={() => clearSelectedFile()}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={16} />
                </button>
              </div>
              {previewUrl ? (
                <div className="case-media">
                  <video
                    aria-describedby="local-preview-note"
                    aria-label={`Local preview of ${selectedFile.name}`}
                    controls
                    onLoadedMetadata={handleLoadedMetadata}
                    playsInline
                    preload="metadata"
                    src={previewUrl}
                    style={{ height: "100%", objectFit: "contain", width: "100%" }}
                  >
                    <track
                      kind="captions"
                      label="No captions supplied for local preview"
                      src="data:text/vtt;charset=utf-8,WEBVTT%0A%0A"
                      srcLang="en"
                    />
                  </video>
                </div>
              ) : null}
              <p className="field-hint" id="local-preview-note">
                Browser-only preview. Captions and an accessible incident description must be added
                before a production release.
              </p>
            </>
          ) : null}

          <div className="form-grid">
            <div>
              <label className="field-label" htmlFor="clip-start-time">
                Start time (seconds) <span aria-hidden="true">*</span>
              </label>
              <input
                aria-describedby={describedBy("clip-start-time", errors)}
                aria-invalid={Boolean(errors["clip-start-time"])}
                className="input tabular"
                id="clip-start-time"
                min="0"
                onChange={(event) => updateField("clipStartTime", event.target.value)}
                required
                step="0.1"
                type="number"
                value={form.clipStartTime}
              />
              <FieldError fieldId="clip-start-time" message={errors["clip-start-time"]} />
            </div>
            <div>
              <label className="field-label" htmlFor="clip-end-time">
                End time (seconds) <span aria-hidden="true">*</span>
              </label>
              <input
                aria-describedby={describedBy("clip-end-time", errors)}
                aria-invalid={Boolean(errors["clip-end-time"])}
                className="input tabular"
                id="clip-end-time"
                min="0.1"
                onChange={(event) => updateField("clipEndTime", event.target.value)}
                required
                step="0.1"
                type="number"
                value={form.clipEndTime}
              />
              <FieldError fieldId="clip-end-time" message={errors["clip-end-time"]} />
            </div>
            <div className="form-field--wide">
              <label className="field-label" htmlFor="poster-frame-label">
                Poster-frame placeholder <span aria-hidden="true">*</span>
              </label>
              <input
                aria-describedby={describedBy("poster-frame-label", errors, "poster-frame-hint")}
                aria-invalid={Boolean(errors["poster-frame-label"])}
                className="input"
                id="poster-frame-label"
                onChange={(event) => updateField("posterFrameLabel", event.target.value)}
                required
                type="text"
                value={form.posterFrameLabel}
              />
              <span className="field-hint" id="poster-frame-hint">
                Describes the non-video fallback until a rights-cleared poster frame is supplied.
              </span>
              <FieldError fieldId="poster-frame-label" message={errors["poster-frame-label"]} />
            </div>
            <div>
              <label className="field-label" htmlFor="source-type">
                Source type <span aria-hidden="true">*</span>
              </label>
              <select
                className="select"
                id="source-type"
                onChange={(event) => updateField("sourceType", event.target.value as SourceType)}
                required
                value={form.sourceType}
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="source-attribution">
                Source attribution <span aria-hidden="true">*</span>
              </label>
              <input
                aria-describedby={describedBy("source-attribution", errors, "source-attribution-hint")}
                aria-invalid={Boolean(errors["source-attribution"])}
                className="input"
                id="source-attribution"
                onChange={(event) => updateField("sourceAttribution", event.target.value)}
                placeholder="Rights holder, creator, or license reference"
                required
                type="text"
                value={form.sourceAttribution}
              />
              <span className="field-hint" id="source-attribution-hint">
                Record the real source; this demo does not verify the claim.
              </span>
              <FieldError fieldId="source-attribution" message={errors["source-attribution"]} />
            </div>
            <div className="form-field--wide">
              <label className="checkbox-row" htmlFor="permission-confirmed">
                <input
                  aria-describedby={describedBy("permission-confirmed", errors, "permission-hint")}
                  aria-invalid={Boolean(errors["permission-confirmed"])}
                  checked={form.permissionConfirmed}
                  id="permission-confirmed"
                  onChange={(event) => updateField("permissionConfirmed", event.target.checked)}
                  required
                  type="checkbox"
                />
                <span>
                  I confirm that I have permission to use this clip in the ClearCall demo and can
                  provide supporting rights information if requested.
                </span>
              </label>
              <span className="field-hint" id="permission-hint">
                Confirmation is recorded locally; it is not a completed legal or moderation review.
              </span>
              <FieldError fieldId="permission-confirmed" message={errors["permission-confirmed"]} />
            </div>
          </div>
        </FormSection>

        <FormSection
          number="02"
          title="Case context"
          description="Give reviewers enough match and rules context to assess the decision."
        >
          <div className="form-grid">
            <div className="form-field--wide">
              <label className="field-label" htmlFor="case-title">
                Case title <span aria-hidden="true">*</span>
              </label>
              <input
                aria-describedby={describedBy("case-title", errors)}
                aria-invalid={Boolean(errors["case-title"])}
                className="input"
                id="case-title"
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Late challenge near the touchline"
                required
                type="text"
                value={form.title}
              />
              <FieldError fieldId="case-title" message={errors["case-title"]} />
            </div>
            <div className="form-field--wide">
              <label className="field-label" htmlFor="case-description">
                Incident context <span aria-hidden="true">*</span>
              </label>
              <textarea
                aria-describedby={describedBy("case-description", errors)}
                aria-invalid={Boolean(errors["case-description"])}
                className="textarea"
                id="case-description"
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Describe player positions, phase of play, and details visible in the clip."
                required
                value={form.description}
              />
              <FieldError fieldId="case-description" message={errors["case-description"]} />
            </div>
            <div>
              <label className="field-label" htmlFor="sport">
                Sport
              </label>
              <select className="select" disabled id="sport" value={form.sport}>
                <option value="soccer">Soccer</option>
              </select>
              <span className="field-hint">This prototype currently supports soccer cases.</span>
            </div>
            <div>
              <label className="field-label" htmlFor="competition-level">
                Competition level <span aria-hidden="true">*</span>
              </label>
              <input
                aria-describedby={describedBy("competition-level", errors)}
                aria-invalid={Boolean(errors["competition-level"])}
                className="input"
                id="competition-level"
                onChange={(event) => updateField("competitionLevel", event.target.value)}
                placeholder="Adult amateur · regional league"
                required
                type="text"
                value={form.competitionLevel}
              />
              <FieldError fieldId="competition-level" message={errors["competition-level"]} />
            </div>
            <div>
              <label className="field-label" htmlFor="ruleset">
                Ruleset <span aria-hidden="true">*</span>
              </label>
              <input
                aria-describedby={describedBy("ruleset", errors)}
                aria-invalid={Boolean(errors.ruleset)}
                className="input"
                id="ruleset"
                onChange={(event) => updateField("ruleset", event.target.value)}
                required
                type="text"
                value={form.ruleset}
              />
              <FieldError fieldId="ruleset" message={errors.ruleset} />
            </div>
            <div>
              <label className="field-label" htmlFor="ruleset-version">
                Ruleset version <span aria-hidden="true">*</span>
              </label>
              <input
                aria-describedby={describedBy("ruleset-version", errors)}
                aria-invalid={Boolean(errors["ruleset-version"])}
                className="input"
                id="ruleset-version"
                onChange={(event) => updateField("rulesetVersion", event.target.value)}
                required
                type="text"
                value={form.rulesetVersion}
              />
              <FieldError fieldId="ruleset-version" message={errors["ruleset-version"]} />
            </div>
            <div>
              <label className="field-label" htmlFor="incident-category">
                Incident category
              </label>
              <select
                className="select"
                id="incident-category"
                onChange={(event) => updateField("category", event.target.value as CaseCategory)}
                value={form.category}
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="difficulty">
                Difficulty
              </label>
              <select
                className="select"
                id="difficulty"
                onChange={(event) => updateField("difficulty", event.target.value as Difficulty)}
                value={form.difficulty}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="form-field--wide">
              <label className="field-label" htmlFor="original-decision">
                Original on-field decision <span aria-hidden="true">*</span>
              </label>
              <input
                aria-describedby={describedBy("original-decision", errors)}
                aria-invalid={Boolean(errors["original-decision"])}
                className="input"
                id="original-decision"
                onChange={(event) => updateField("originalDecision", event.target.value)}
                placeholder="Play continued; no card shown"
                required
                type="text"
                value={form.originalDecision}
              />
              <FieldError fieldId="original-decision" message={errors["original-decision"]} />
            </div>
          </div>
        </FormSection>

        <FormSection
          number="03"
          title="Decision"
          description="Write one clear question and three to five mutually distinct calls."
        >
          <div>
            <label className="field-label" htmlFor="case-prompt">
              Learner prompt <span aria-hidden="true">*</span>
            </label>
            <textarea
              aria-describedby={describedBy("case-prompt", errors, "case-prompt-hint")}
              aria-invalid={Boolean(errors["case-prompt"])}
              className="textarea"
              id="case-prompt"
              onChange={(event) => updateField("prompt", event.target.value)}
              placeholder="What is the correct disciplinary decision?"
              required
              value={form.prompt}
            />
            <span className="field-hint" id="case-prompt-hint">
              Ask for one decision that can be evaluated against the listed choices.
            </span>
            <FieldError fieldId="case-prompt" message={errors["case-prompt"]} />
          </div>

          <fieldset className="choice-group" id="answer-options">
            <legend className="field-label">
              Answer choices <span aria-hidden="true">*</span>
            </legend>
            <span className="field-hint">Keep between three and five choices.</span>
            <div className="answer-builder">
              {form.answers.map((answer, index) => (
                <div className="answer-builder__row" key={answer.uid}>
                  <span className="answer-builder__index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <label className="sr-only" htmlFor={`answer-label-${answer.uid}`}>
                      Answer {index + 1}
                    </label>
                    <input
                      aria-describedby={describedBy(`answer-label-${answer.uid}`, errors)}
                      aria-invalid={Boolean(errors[`answer-label-${answer.uid}`])}
                      className="input"
                      id={`answer-label-${answer.uid}`}
                      onChange={(event) => updateAnswer(answer.uid, event.target.value)}
                      placeholder={index === 0 ? "Direct free kick and red card" : `Answer ${index + 1}`}
                      required
                      type="text"
                      value={answer.label}
                    />
                    <FieldError
                      fieldId={`answer-label-${answer.uid}`}
                      message={errors[`answer-label-${answer.uid}`]}
                    />
                  </div>
                  {form.answers.length > 3 ? (
                    <button
                      aria-label={`Remove answer ${index + 1}`}
                      className="icon-button icon-button--small"
                      onClick={() => removeAnswer(answer.uid)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </button>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
            <FieldError fieldId="answer-options" message={errors["answer-options"]} />
            {form.answers.length < 5 ? (
              <button className="button button--secondary" onClick={addAnswer} type="button">
                <Plus aria-hidden="true" size={16} />
                Add answer
              </button>
            ) : (
              <p className="field-hint">Maximum of five answer choices reached.</p>
            )}
          </fieldset>

          <div className="form-grid">
            <div>
              <label className="field-label" htmlFor="recommended-answer">
                Recommended decision <span aria-hidden="true">*</span>
              </label>
              <select
                aria-describedby={describedBy("recommended-answer", errors)}
                aria-invalid={Boolean(errors["recommended-answer"])}
                className="select"
                id="recommended-answer"
                onChange={(event) => updateField("recommendedAnswerUid", event.target.value)}
                required
                value={form.recommendedAnswerUid}
              >
                <option value="">Select an answer</option>
                {form.answers.map((answer, index) => (
                  <option key={answer.uid} value={answer.uid}>
                    {answer.label.trim() || `Answer ${index + 1} (label needed)`}
                  </option>
                ))}
              </select>
              <FieldError fieldId="recommended-answer" message={errors["recommended-answer"]} />
            </div>
            <div>
              <label className="field-label" htmlFor="scenario-status">
                Scenario status
              </label>
              <select
                className="select"
                id="scenario-status"
                onChange={(event) => updateField("scenarioStatus", event.target.value as ScenarioStatus)}
                value={form.scenarioStatus}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="field-hint">Reviewers must confirm this classification.</span>
            </div>
          </div>
        </FormSection>

        <FormSection
          number="04"
          title="Structured reasoning"
          description="Make the decision path inspectable instead of relying on a free-form verdict."
        >
          <fieldset className="choice-group" id="reasoning-factors">
            <legend className="field-label">
              Decision factors <span aria-hidden="true">*</span>
            </legend>
            <span className="field-hint">
              Keys remain stable; labels and observed values are learner-facing.
            </span>
            <div className="answer-builder">
              {form.factors.map((factor, index) => (
                <fieldset className="form-section" key={factor.uid}>
                  <legend className="field-label">Factor {index + 1}</legend>
                  <div className="form-grid">
                    <div>
                      <label className="field-label" htmlFor={`factor-key-${factor.uid}`}>
                        Stable key <span aria-hidden="true">*</span>
                      </label>
                      <input
                        aria-describedby={describedBy(`factor-key-${factor.uid}`, errors)}
                        aria-invalid={Boolean(errors[`factor-key-${factor.uid}`])}
                        className="input tabular"
                        id={`factor-key-${factor.uid}`}
                        onChange={(event) => updateFactor(factor.uid, { key: event.target.value })}
                        placeholder="point-of-contact"
                        required
                        type="text"
                        value={factor.key}
                      />
                      <FieldError
                        fieldId={`factor-key-${factor.uid}`}
                        message={errors[`factor-key-${factor.uid}`]}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`factor-label-${factor.uid}`}>
                        Factor label <span aria-hidden="true">*</span>
                      </label>
                      <input
                        aria-describedby={describedBy(`factor-label-${factor.uid}`, errors)}
                        aria-invalid={Boolean(errors[`factor-label-${factor.uid}`])}
                        className="input"
                        id={`factor-label-${factor.uid}`}
                        onChange={(event) => updateFactor(factor.uid, { label: event.target.value })}
                        placeholder="Point of contact"
                        required
                        type="text"
                        value={factor.label}
                      />
                      <FieldError
                        fieldId={`factor-label-${factor.uid}`}
                        message={errors[`factor-label-${factor.uid}`]}
                      />
                    </div>
                    <div className="form-field--wide">
                      <label className="field-label" htmlFor={`factor-value-${factor.uid}`}>
                        Observed value <span aria-hidden="true">*</span>
                      </label>
                      <input
                        aria-describedby={describedBy(`factor-value-${factor.uid}`, errors)}
                        aria-invalid={Boolean(errors[`factor-value-${factor.uid}`])}
                        className="input"
                        id={`factor-value-${factor.uid}`}
                        onChange={(event) => updateFactor(factor.uid, { value: event.target.value })}
                        placeholder="Contact lands above the ankle"
                        required
                        type="text"
                        value={factor.value}
                      />
                      <FieldError
                        fieldId={`factor-value-${factor.uid}`}
                        message={errors[`factor-value-${factor.uid}`]}
                      />
                    </div>
                    <div className="form-field--wide">
                      <label className="field-label" htmlFor={`factor-explanation-${factor.uid}`}>
                        Why it matters <span aria-hidden="true">*</span>
                      </label>
                      <textarea
                        aria-describedby={describedBy(`factor-explanation-${factor.uid}`, errors)}
                        aria-invalid={Boolean(errors[`factor-explanation-${factor.uid}`])}
                        className="textarea"
                        id={`factor-explanation-${factor.uid}`}
                        onChange={(event) => updateFactor(factor.uid, { explanation: event.target.value })}
                        placeholder="Explain how this observation supports or cuts against the recommendation."
                        required
                        value={factor.explanation}
                      />
                      <FieldError
                        fieldId={`factor-explanation-${factor.uid}`}
                        message={errors[`factor-explanation-${factor.uid}`]}
                      />
                    </div>
                    <div className="form-field--wide">
                      <label className="checkbox-row">
                        <input
                          checked={factor.supportsRecommendation}
                          onChange={(event) =>
                            updateFactor(factor.uid, {
                              supportsRecommendation: event.target.checked,
                            })
                          }
                          type="checkbox"
                        />
                        <span>This factor supports the recommended decision.</span>
                      </label>
                    </div>
                  </div>
                  {form.factors.length > 1 ? (
                    <button
                      className="button button--ghost"
                      onClick={() => removeFactor(factor.uid)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={15} />
                      Remove factor {index + 1}
                    </button>
                  ) : null}
                </fieldset>
              ))}
            </div>
            <FieldError fieldId="reasoning-factors" message={errors["reasoning-factors"]} />
            <button className="button button--secondary" onClick={addFactor} type="button">
              <Plus aria-hidden="true" size={16} />
              Add factor
            </button>
          </fieldset>

          <div>
            <label className="field-label" htmlFor="critical-factor">
              Critical factor <span aria-hidden="true">*</span>
            </label>
            <select
              aria-describedby={describedBy("critical-factor", errors, "critical-factor-hint")}
              aria-invalid={Boolean(errors["critical-factor"])}
              className="select"
              id="critical-factor"
              onChange={(event) => updateField("criticalFactorUid", event.target.value)}
              required
              value={form.criticalFactorUid}
            >
              <option value="">Select a factor</option>
              {form.factors.map((factor, index) => (
                <option key={factor.uid} value={factor.uid}>
                  {factor.label.trim() || factor.key.trim() || `Factor ${index + 1} (label needed)`}
                </option>
              ))}
            </select>
            <span className="field-hint" id="critical-factor-hint">
              The observation that most directly separates the plausible outcomes.
            </span>
            <FieldError fieldId="critical-factor" message={errors["critical-factor"]} />
          </div>

          <fieldset className="choice-group">
            <legend className="field-label">
              Rule path <span aria-hidden="true">*</span>
            </legend>
            <span className="field-hint">Build the path from broad law to the decisive clause.</span>
            <div className="answer-builder">
              {form.rulePath.map((segment, index) => (
                <div className="answer-builder__row" key={`rule-path-${index}`}>
                  <span className="answer-builder__index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <label className="sr-only" htmlFor={`rule-path-${index}`}>
                      Rule path step {index + 1}
                    </label>
                    <input
                      aria-describedby={describedBy(`rule-path-${index}`, errors)}
                      aria-invalid={Boolean(errors[`rule-path-${index}`])}
                      className="input"
                      id={`rule-path-${index}`}
                      onChange={(event) => updateRulePath(index, event.target.value)}
                      placeholder={index === 0 ? "Law 12 — Fouls and Misconduct" : "Disciplinary action"}
                      required
                      type="text"
                      value={segment}
                    />
                    <FieldError
                      fieldId={`rule-path-${index}`}
                      message={errors[`rule-path-${index}`]}
                    />
                  </div>
                  {form.rulePath.length > 1 ? (
                    <button
                      aria-label={`Remove rule path step ${index + 1}`}
                      className="icon-button icon-button--small"
                      onClick={() => removeRulePath(index)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </button>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
            <button
              className="button button--secondary"
              onClick={() => updateField("rulePath", [...form.rulePath, ""])}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              Add rule-path step
            </button>
          </fieldset>

          <div className="form-grid">
            <div className="form-field--wide">
              <label className="field-label" htmlFor="rule-reference">
                Rule citation <span aria-hidden="true">*</span>
              </label>
              <input
                aria-describedby={describedBy("rule-reference", errors, "rule-reference-hint")}
                aria-invalid={Boolean(errors["rule-reference"])}
                className="input"
                id="rule-reference"
                onChange={(event) => updateField("ruleReference", event.target.value)}
                placeholder="Law 12 · Serious foul play"
                required
                type="text"
                value={form.ruleReference}
              />
              <span className="field-hint" id="rule-reference-hint">
                Cite the supplied ruleset and version precisely; reviewers must verify it.
              </span>
              <FieldError fieldId="rule-reference" message={errors["rule-reference"]} />
            </div>
            <div className="form-field--wide">
              <label className="field-label" htmlFor="expert-explanation">
                Short expert explanation <span aria-hidden="true">*</span>
              </label>
              <textarea
                aria-describedby={describedBy("expert-explanation", errors, "expert-explanation-hint")}
                aria-invalid={Boolean(errors["expert-explanation"])}
                className="textarea"
                id="expert-explanation"
                onChange={(event) => updateField("expertExplanation", event.target.value)}
                placeholder="State the recommended interpretation and connect it to the decisive observations."
                required
                value={form.expertExplanation}
              />
              <span className="field-hint" id="expert-explanation-hint">
                This remains a creator-authored draft until qualified reviewers approve it.
              </span>
              <FieldError fieldId="expert-explanation" message={errors["expert-explanation"]} />
            </div>
          </div>
        </FormSection>

        <FormSection
          number="05"
          title="Review and submit"
          description="Resolve every blocking issue, then add the draft to this browser's demo state."
        >
          {Object.keys(errors).length > 0 ? (
            <div
              aria-labelledby="validation-summary-title"
              className="validation-summary"
              ref={validationSummaryRef}
              role="alert"
              tabIndex={-1}
            >
              <h2 id="validation-summary-title">
                Fix {Object.keys(errors).length} {Object.keys(errors).length === 1 ? "issue" : "issues"} before submitting
              </h2>
              <ul>
                {Object.entries(errors).map(([fieldId, message]) => (
                  <li key={fieldId}>
                    <a href={`#${fieldId}`} onClick={(event) => handleValidationLink(event, fieldId)}>
                      {message}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="permission-notice">
            <ShieldAlert aria-hidden="true" size={18} />
            <span>
              Submit for review stores structured text and file metadata locally. It does not upload
              the clip, publish a public case, verify credentials or rights, or create an official
              ruling.
            </span>
          </div>

          <button className="button button--wide" disabled={!hydrated} type="submit">
            <Send aria-hidden="true" size={17} />
            Submit for expert review
          </button>
          <p className="field-hint" role="status">
            {!hydrated
              ? "Preparing browser-local demo storage; submission will be available shortly."
              : Object.keys(errors).length > 0
                ? `${Object.keys(errors).length} blocking ${Object.keys(errors).length === 1 ? "issue remains" : "issues remain"}.`
                : "Ready to store a browser-local draft."}
          </p>
        </FormSection>
      </form>

      <CasePreview model={livePreviewModel(form, selectedFile)} />
    </div>
  );
}
