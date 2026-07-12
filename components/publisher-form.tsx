"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileImage,
  FileText,
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
  MediaKind,
  PublishedCaseDraft,
} from "@/lib/types";

interface AnswerDraft {
  uid: string;
  label: string;
}

interface PublisherFormState {
  mediaKind: MediaKind;
  mediaAlt: string;
  permissionConfirmed: boolean;
  title: string;
  description: string;
  category: CaseCategory;
  difficulty: Difficulty;
  prompt: string;
  answers: AnswerDraft[];
  recommendedAnswerUid: string;
}

type ValidationErrors = Record<string, string>;

interface PreviewModel {
  mediaKind: MediaKind;
  mediaAlt: string;
  title: string;
  prompt: string;
  description: string;
  category: string;
  difficulty: string;
  answers: readonly string[];
  recommendedAnswer: string;
  clipLabel: string;
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

const PUBLISH_STEPS = [
  {
    number: "01",
    title: "Case content",
    shortTitle: "Content",
    description: "Add the incident post and a short description reviewers can inspect.",
  },
  {
    number: "02",
    title: "Decision",
    shortTitle: "Decision",
    description: "Ask one question and list the calls a learner can choose from.",
  },
] as const;

function createInitialForm(): PublisherFormState {
  return {
    mediaKind: "text",
    mediaAlt: "",
    permissionConfirmed: false,
    title: "",
    description: "",
    category: "Serious foul play",
    difficulty: "intermediate",
    prompt: "",
    answers: [
      { uid: "answer-1", label: "" },
      { uid: "answer-2", label: "" },
      { uid: "answer-3", label: "" },
    ],
    recommendedAnswerUid: "",
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

function isSupportedImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(file.name);
}

function validateForm(
  form: PublisherFormState,
  selectedFile: File | null,
  fileError: string,
): ValidationErrors {
  const errors: ValidationErrors = {};
  const add = (id: string, message: string) => {
    if (!errors[id]) errors[id] = message;
  };

  if (form.mediaKind !== "text") {
    if (fileError) add("clip-file", fileError);
    else if (!selectedFile) {
      add("clip-file", `Choose a local ${form.mediaKind} file to preview.`);
    }
    if (!form.mediaAlt.trim()) {
      add("media-alt", `Describe what the ${form.mediaKind} shows.`);
    }
  }

  if (!form.title.trim()) add("case-title", "Add a concise case title.");
  if (!form.description.trim()) add("case-description", "Describe the incident context.");
  if (!form.permissionConfirmed) {
    add("permission-confirmed", "Confirm that ClearCall may use this post material in the demo.");
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

  return errors;
}

function fieldStep(fieldId: string): number {
  if (
    fieldId === "clip-file" ||
    fieldId === "media-alt" ||
    fieldId === "case-title" ||
    fieldId === "case-description" ||
    fieldId === "permission-confirmed"
  ) {
    return 0;
  }
  return 1;
}

function filterErrorsForStep(errors: ValidationErrors, step: number): ValidationErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([fieldId]) => fieldStep(fieldId) === step),
  );
}

function firstStepWithErrors(errors: ValidationErrors): number {
  let earliest = PUBLISH_STEPS.length - 1;
  for (const fieldId of Object.keys(errors)) {
    earliest = Math.min(earliest, fieldStep(fieldId));
  }
  return earliest;
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
  ref,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
  ref?: Ref<HTMLElement>;
}) {
  return (
    <section
      className="form-section"
      aria-labelledby={`publish-section-${number}`}
      ref={ref}
      tabIndex={-1}
    >
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

      <article className="preview-card" data-media={model.mediaKind}>
        {model.mediaKind !== "text" ? (
          <div className="preview-card__stage">
            <div className="case-media__field" aria-hidden="true" />
            <div className="case-media__topline">
              <span className="meta-chip">Soccer</span>
              <span className="meta-chip">{model.clipLabel}</span>
            </div>
            <div className="case-media__placeholder">
              <span className="case-media__placeholder-icon" aria-hidden="true">
                {model.mediaKind === "image" ? <FileImage size={22} /> : <Film size={22} />}
              </span>
              <strong>{`${model.mediaKind} preview`}</strong>
              <span>{model.mediaAlt || `Accessible ${model.mediaKind} description not added yet.`}</span>
            </div>
          </div>
        ) : null}

        <div className="preview-card__body">
          <div className="meta-row">
            <span className="status-badge status-badge--pending">Pending expert review</span>
            <span className="meta-chip">{model.category || "Category"}</span>
            <span className="meta-chip">{model.difficulty || "Difficulty"}</span>
          </div>
          <h2>{model.title || "Untitled case"}</h2>
          <p>{model.prompt || "Your learner-facing decision question will appear here."}</p>
          <p>{model.description || "Incident context has not been added yet."}</p>

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
        </div>
      </article>

      <div className="permission-notice">
        <ShieldAlert aria-hidden="true" size={17} />
        <span>
          Preview only. It is not an official ruling and does not indicate that creator credentials,
          media rights, or expert review have been verified.
        </span>
      </div>
    </aside>
  );
}

function livePreviewModel(form: PublisherFormState, selectedFile: File | null): PreviewModel {
  const recommended = form.answers.find((answer) => answer.uid === form.recommendedAnswerUid)?.label ?? "";
  return {
    mediaKind: form.mediaKind,
    mediaAlt: form.mediaKind === "text" ? form.description : form.mediaAlt,
    title: form.title,
    prompt: form.prompt,
    description: form.description,
    category: form.category,
    difficulty: form.difficulty,
    answers: form.answers.map((answer) => answer.label),
    recommendedAnswer: recommended,
    clipLabel: selectedFile ? selectedFile.name : form.mediaKind === "text" ? "Text post" : `No local ${form.mediaKind}`,
    isPending: false,
  };
}

function submittedPreviewModel(draft: PublishedCaseDraft): PreviewModel {
  const recommended = draft.answerOptions.find((answer) => answer.id === draft.recommendedDecision)?.label ?? "";
  return {
    mediaKind: draft.mediaKind,
    mediaAlt: draft.mediaAlt,
    title: draft.title,
    prompt: draft.prompt,
    description: draft.description,
    category: draft.category,
    difficulty: draft.difficulty,
    answers: draft.answerOptions.map((answer) => answer.label),
    recommendedAnswer: recommended,
    clipLabel: draft.mediaFileName ?? draft.clipFileName ?? `${draft.mediaKind} post`,
    isPending: true,
  };
}

function buildDraftDefaults(form: PublisherFormState, recommendedLabel: string) {
  return {
    competitionLevel: "Adult amateur",
    ruleset: "IFAB Laws of the Game",
    rulesetVersion: "2025/26",
    originalDecision: recommendedLabel || "See recommended decision",
    scenarioStatus: "EXPERT_CONSENSUS" as const,
    sourceType: "team-recorded" as const,
    sourceAttribution: "Demo creator",
    factors: [
      {
        key: "decisive-observation",
        label: "Decisive observation",
        value: form.description.trim().slice(0, 120) || "Key evidence from the incident",
        supportsRecommendation: true,
        explanation: "Primary observation supporting the recommended call in this demo draft.",
      },
    ],
    criticalFactor: "decisive-observation",
    rulePath: ["Law 12", form.category],
    ruleReference: `IFAB Laws of the Game · ${form.category}`,
    expertExplanation:
      form.prompt.trim() ||
      "Creator-authored draft pending qualified expert review.",
  };
}

export function PublisherForm() {
  const { hydrated, publishDraft } = useDemo();
  const { showToast } = useToast();
  const [form, setForm] = useState<PublisherFormState>(createInitialForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const [stepValidationActive, setStepValidationActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highestStepReached, setHighestStepReached] = useState(0);
  const [submittedDraft, setSubmittedDraft] = useState<PublishedCaseDraft | null>(null);
  const answerSequence = useRef(4);
  const draftSequence = useRef(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const validationSummaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLElement>(null);
  const stepPanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function revalidate(
    nextForm: PublisherFormState,
    nextFile = selectedFile,
    nextFileError = fileError,
    step = currentStep,
  ) {
    if (submissionAttempted) {
      setErrors(validateForm(nextForm, nextFile, nextFileError));
      return;
    }
    if (stepValidationActive) {
      setErrors(filterErrorsForStep(validateForm(nextForm, nextFile, nextFileError), step));
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
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (shouldRevalidate && submissionAttempted) {
      setErrors(validateForm(form, null, ""));
    }
  }

  function chooseFile(file: File) {
    const supported = form.mediaKind === "image"
      ? isSupportedImage(file)
      : form.mediaKind === "video" && isSupportedVideo(file);
    if (!supported) {
      clearSelectedFile(false);
      const message = form.mediaKind === "image"
        ? "Choose an image file such as AVIF, GIF, JPEG, PNG, SVG, or WebP."
        : "Choose a video file such as MP4, WebM, MOV, M4V, or OGV.";
      setFileError(message);
      if (submissionAttempted) setErrors(validateForm(form, null, message));
      return;
    }

    releasePreviewUrl();
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    setFileError("");
    if (submissionAttempted) setErrors(validateForm(form, file, ""));
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

  function selectMediaKind(mediaKind: MediaKind) {
    clearSelectedFile(false);
    const next = { ...form, mediaKind, mediaAlt: mediaKind === "text" ? "" : form.mediaAlt };
    setForm(next);
    if (submissionAttempted) setErrors(validateForm(next, null, ""));
  }

  function selectMediaKind(mediaKind: MediaKind) {
    clearSelectedFile(false);
    const next = {
      ...form,
      mediaKind,
      clipEndTime: mediaKind === "video" ? form.clipEndTime : "",
      posterFrameLabel: mediaKind === "video"
        ? form.posterFrameLabel || "Poster frame selected during expert review"
        : "",
    };
    setForm(next);
    if (submissionAttempted) setErrors(validateForm(next, null, null, ""));
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

  function handleValidationLink(event: React.MouseEvent<HTMLAnchorElement>, fieldId: string) {
    event.preventDefault();
    const step = fieldStep(fieldId);
    setCurrentStep(step);
    setHighestStepReached((reached) => Math.max(reached, step));
    window.requestAnimationFrame(() => {
      const target = document.getElementById(fieldId);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
    });
  }

  function goToStep(step: number) {
    if (step < 0 || step >= PUBLISH_STEPS.length || step > highestStepReached) return;
    setCurrentStep(step);
    window.requestAnimationFrame(() => {
      stepPanelRef.current?.focus({ preventScroll: true });
      stepPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function goBack() {
    if (currentStep <= 0) return;
    goToStep(currentStep - 1);
  }

  function goContinue() {
    const allErrors = validateForm(form, selectedFile, fileError);
    const stepErrors = filterErrorsForStep(allErrors, currentStep);
    setStepValidationActive(true);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      window.requestAnimationFrame(() => {
        const firstId = Object.keys(stepErrors)[0];
        const target = document.getElementById(firstId);
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
        target?.focus({ preventScroll: true });
      });
      return;
    }

    const nextStep = Math.min(currentStep + 1, PUBLISH_STEPS.length - 1);
    setStepValidationActive(false);
    setErrors({});
    setCurrentStep(nextStep);
    setHighestStepReached((reached) => Math.max(reached, nextStep));
    window.requestAnimationFrame(() => {
      stepPanelRef.current?.focus({ preventScroll: true });
      stepPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionAttempted(true);
    setStepValidationActive(false);
    const nextErrors = validateForm(form, selectedFile, fileError);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || (form.mediaKind !== "text" && !selectedFile)) {
      const step = firstStepWithErrors(nextErrors);
      setCurrentStep(step);
      setHighestStepReached((reached) => Math.max(reached, step));
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
    const recommendedLabel = form.answers[recommendedIndex]?.label.trim() ?? "";
    const defaults = buildDraftDefaults(form, recommendedLabel);

    const draft: PublishedCaseDraft = {
      id: `draft-local-${draftSequence.current++}`,
      mediaKind: form.mediaKind,
      mediaFileName: selectedFile?.name,
      mediaFileSize: selectedFile?.size,
      mediaFileType: selectedFile?.type || undefined,
      mediaAlt: form.mediaKind === "text" ? form.description.trim() : form.mediaAlt.trim(),
      clipFileName: form.mediaKind === "video" ? selectedFile?.name : undefined,
      clipFileSize: form.mediaKind === "video" ? selectedFile?.size : undefined,
      clipFileType: form.mediaKind === "video" ? selectedFile?.type || "video/unknown" : undefined,
      clipStartTime: form.mediaKind === "video" ? "0" : undefined,
      clipEndTime: form.mediaKind === "video" ? "15" : undefined,
      posterFrameLabel: form.mediaKind === "video" ? "Poster frame selected during expert review" : undefined,
      title: form.title.trim(),
      prompt: form.prompt.trim(),
      description: form.description.trim(),
      competitionLevel: defaults.competitionLevel,
      difficulty: form.difficulty,
      category: form.category,
      originalDecision: defaults.originalDecision,
      scenarioStatus: defaults.scenarioStatus,
      answerOptions,
      recommendedDecision: `option-${recommendedIndex + 1}`,
      factors: defaults.factors,
      criticalFactor: defaults.criticalFactor,
      rulePath: defaults.rulePath,
      ruleReference: defaults.ruleReference,
      expertExplanation: defaults.expertExplanation,
      ruleset: defaults.ruleset,
      rulesetVersion: defaults.rulesetVersion,
      sourceType: defaults.sourceType,
      sourceAttribution: defaults.sourceAttribution,
      permissionStatus: "confirmed",
      permissionConfirmed: true,
      createdAt: new Date().toISOString(),
      status: "draft",
      reviewStatus: "PENDING_EXPERT_REVIEW",
    };

    const published = await publishDraft(draft, selectedFile);
    if (!published) {
      showToast("Sign in to publish a case for expert review.");
      return;
    }
    setSubmittedDraft(draft);
    clearSelectedFile(false);
    showToast("Case submitted for expert review.", "success");
    window.setTimeout(() => successRef.current?.focus(), 0);
  }

  function startAnotherDraft() {
    clearSelectedFile(false);
    answerSequence.current = 4;
    setForm(createInitialForm());
    setErrors({});
    setSubmissionAttempted(false);
    setStepValidationActive(false);
    setCurrentStep(0);
    setHighestStepReached(0);
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
            The structured case and media metadata are stored in this browser&apos;s ClearCall demo
            state. Any selected file and its temporary preview URL were discarded and were not
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
              <FileText aria-hidden="true" size={17} />
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

  const activeStep = PUBLISH_STEPS[currentStep];
  const errorEntries = Object.entries(errors);

  return (
    <div className="publish-layout">
      <form className="publisher-form" noValidate onSubmit={handleSubmit}>
        <nav aria-label="Publish steps" className="publish-progress">
          <ol className="publish-progress--compact">
            {PUBLISH_STEPS.map((step, index) => {
              const isCurrent = index === currentStep;
              const isReachable = index <= highestStepReached;
              return (
                <li key={step.number} data-complete={index < currentStep || undefined}>
                  <button
                    aria-current={isCurrent ? "step" : undefined}
                    disabled={!isReachable}
                    onClick={() => goToStep(index)}
                    type="button"
                  >
                    <span aria-hidden="true">{step.number}</span>
                    <span>{step.shortTitle}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {submissionAttempted && errorEntries.length > 0 ? (
          <div
            aria-labelledby="validation-summary-title"
            className="validation-summary"
            ref={validationSummaryRef}
            role="alert"
            tabIndex={-1}
          >
            <h2 id="validation-summary-title">
              Fix {errorEntries.length} {errorEntries.length === 1 ? "issue" : "issues"} before submitting
            </h2>
            <ul>
              {errorEntries.map(([fieldId, message]) => (
                <li key={fieldId}>
                  <a href={`#${fieldId}`} onClick={(event) => handleValidationLink(event, fieldId)}>
                    {message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <FormSection
          description={activeStep.description}
          number={activeStep.number}
          ref={stepPanelRef}
          title={activeStep.title}
        >
          {currentStep === 0 ? (
            <>
              <fieldset className="media-kind-picker">
                <legend className="field-label">Post format</legend>
                <div>
                  {(["text", "image", "video"] as const).map((kind) => (
                    <label key={kind}>
                      <input
                        checked={form.mediaKind === kind}
                        name="media-kind"
                        onChange={() => selectMediaKind(kind)}
                        type="radio"
                        value={kind}
                      />
                      <span>
                        {kind === "text" ? (
                          <FileText aria-hidden="true" size={17} />
                        ) : kind === "image" ? (
                          <FileImage aria-hidden="true" size={17} />
                        ) : (
                          <FileVideo aria-hidden="true" size={17} />
                        )}
                        {kind[0].toUpperCase() + kind.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {form.mediaKind !== "text" ? (
                <>
                  <label className="field-label" htmlFor="clip-file">
                    Local {form.mediaKind} <span aria-hidden="true">*</span>
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
                      <strong>Drop one {form.mediaKind} here or choose it below</strong>
                      <p id="clip-file-hint">
                        {form.mediaKind === "image"
                          ? "AVIF, GIF, JPEG, PNG, SVG, or WebP."
                          : "MP4, WebM, MOV, M4V, or OGV."}{" "}
                        The file stays in this tab and is not persisted.
                      </p>
                      <input
                        accept={form.mediaKind === "image" ? "image/*,.svg" : "video/*,.mov,.m4v,.ogv"}
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
                            {` · ${selectedFile.type || `${form.mediaKind} file`}`}
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
                      {previewUrl && form.mediaKind === "video" ? (
                        <div className="case-media">
                          <video
                            aria-label={`Local preview of ${selectedFile.name}`}
                            controls
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
                      ) : previewUrl && form.mediaKind === "image" ? (
                        <div className="case-media case-media--image">
                          <Image
                            alt={form.mediaAlt || `Local preview of ${selectedFile.name}`}
                            fill
                            sizes="(max-width: 900px) 100vw, 50vw"
                            src={previewUrl}
                            unoptimized
                          />
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  <div>
                    <label className="field-label" htmlFor="media-alt">
                      Accessible media description <span aria-hidden="true">*</span>
                    </label>
                    <textarea
                      aria-describedby={describedBy("media-alt", errors)}
                      aria-invalid={Boolean(errors["media-alt"])}
                      className="textarea"
                      id="media-alt"
                      onChange={(event) => updateField("mediaAlt", event.target.value)}
                      placeholder={`Describe the incident details visible in the ${form.mediaKind}.`}
                      required
                      value={form.mediaAlt}
                    />
                    <FieldError fieldId="media-alt" message={errors["media-alt"]} />
                  </div>
                </>
              ) : null}

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
                    placeholder="Describe player positions, phase of play, and decision-relevant details."
                    required
                    value={form.description}
                  />
                  <FieldError fieldId="case-description" message={errors["case-description"]} />
                </div>
                <div className="form-field--wide">
                  <label className="checkbox-row" htmlFor="permission-confirmed">
                    <input
                      aria-describedby={describedBy("permission-confirmed", errors)}
                      aria-invalid={Boolean(errors["permission-confirmed"])}
                      checked={form.permissionConfirmed}
                      id="permission-confirmed"
                      onChange={(event) => updateField("permissionConfirmed", event.target.checked)}
                      required
                      type="checkbox"
                    />
                    <span>
                      I confirm that I have permission to use this post material in the ClearCall demo.
                    </span>
                  </label>
                  <FieldError fieldId="permission-confirmed" message={errors["permission-confirmed"]} />
                </div>
              </div>
            </>
          ) : null}

          {currentStep === 1 ? (
            <>
              <div>
                <label className="field-label" htmlFor="case-prompt">
                  Learner prompt <span aria-hidden="true">*</span>
                </label>
                <textarea
                  aria-describedby={describedBy("case-prompt", errors)}
                  aria-invalid={Boolean(errors["case-prompt"])}
                  className="textarea"
                  id="case-prompt"
                  onChange={(event) => updateField("prompt", event.target.value)}
                  placeholder="What is the correct disciplinary decision?"
                  required
                  value={form.prompt}
                />
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
              </div>

              <div className="permission-notice">
                <ShieldAlert aria-hidden="true" size={18} />
                <span>
                  Submit stores structured text and file metadata locally. It does not upload media,
                  publish a public case, or create an official ruling.
                </span>
              </div>
            </>
          ) : null}
        </FormSection>

        <div className="publish-step-actions">
          {currentStep > 0 ? (
            <button className="button button--secondary" onClick={goBack} type="button">
              <ArrowLeft aria-hidden="true" size={17} />
              Back
            </button>
          ) : (
            <span />
          )}
          {currentStep < PUBLISH_STEPS.length - 1 ? (
            <button className="button" onClick={goContinue} type="button">
              Continue
              <ArrowRight aria-hidden="true" size={17} />
            </button>
          ) : (
            <button className="button" disabled={!hydrated} type="submit">
              <Send aria-hidden="true" size={17} />
              Submit for expert review
            </button>
          )}
        </div>
        <p className="field-hint publish-step-status" role="status">
          {!hydrated
            ? "Preparing browser-local demo storage; submission will be available shortly."
            : `Step ${currentStep + 1} of ${PUBLISH_STEPS.length}`}
        </p>
      </form>

      <CasePreview model={livePreviewModel(form, selectedFile)} />
    </div>
  );
}
