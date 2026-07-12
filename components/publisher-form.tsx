"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  FileText,
  FileVideo,
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
  description: string;
  category: CaseCategory;
  difficulty: Difficulty;
  originalDecision: string;
  answers: AnswerDraft[];
  permissionConfirmed: boolean;
}

type ValidationErrors = Record<string, string>;

const CATEGORY_OPTIONS: readonly CaseCategory[] = [
  "Serious foul play",
  "Handball",
  "Offside interference",
  "Denial of an obvious goal-scoring opportunity",
  "Advantage",
  "Simulation",
  "Goalkeeper handling",
];

function createInitialForm(): PublisherFormState {
  return {
    mediaKind: "video",
    description: "",
    category: "Serious foul play",
    difficulty: "intermediate",
    originalDecision: "",
    answers: [
      { uid: "answer-1", label: "" },
      { uid: "answer-2", label: "" },
    ],
    permissionConfirmed: false,
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

function titleFromDescription(description: string): string {
  const firstLine = description.trim().split(/\n/)[0]?.trim() ?? "";
  if (!firstLine) return "Untitled case";
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}…` : firstLine;
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
      add("clip-file", `Choose a ${form.mediaKind} file.`);
    }
  }

  if (!form.description.trim()) {
    add("case-description", "Describe what happened.");
  }
  if (!form.originalDecision.trim()) {
    add("original-decision", "Add the original on-field decision.");
  }

  const filledAnswers = form.answers.filter((answer) => answer.label.trim());
  if (filledAnswers.length < 2) {
    add("answer-options", "Add at least two answer choices.");
  }
  const answerLabels = new Set<string>();
  form.answers.forEach((answer, index) => {
    const value = answer.label.trim();
    if (!value) return;
    const normalized = value.toLocaleLowerCase();
    if (answerLabels.has(normalized)) {
      add(`answer-label-${answer.uid}`, "Each answer choice must be distinct.");
    }
    answerLabels.add(normalized);
    if (!value && index < 2) {
      add(`answer-label-${answer.uid}`, `Add a label for answer ${index + 1}.`);
    }
  });
  if (filledAnswers.length < 2) {
    form.answers.slice(0, 2).forEach((answer, index) => {
      if (!answer.label.trim()) {
        add(`answer-label-${answer.uid}`, `Add a label for answer ${index + 1}.`);
      }
    });
  }

  if (!form.permissionConfirmed) {
    add("permission-confirmed", "Confirm you have rights to share this material.");
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
  const [submittedDraft, setSubmittedDraft] = useState<PublishedCaseDraft | null>(null);
  const answerSequence = useRef(3);
  const draftSequence = useRef(1);
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
      setErrors(validateForm(nextForm, nextFile, nextFileError));
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

  function selectMediaKind(mediaKind: MediaKind) {
    clearSelectedFile(false);
    const next = { ...form, mediaKind };
    setForm(next);
    if (submissionAttempted) {
      setErrors(validateForm(next, null, ""));
    }
  }

  function chooseFile(file: File) {
    const supported =
      form.mediaKind === "image"
        ? isSupportedImage(file)
        : form.mediaKind === "video" && isSupportedVideo(file);
    if (!supported) {
      clearSelectedFile(false);
      const message =
        form.mediaKind === "image"
          ? "Choose an image file such as JPEG, PNG, or WebP."
          : "Choose a video file such as MP4 or WebM.";
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
    if (form.answers.length <= 2) return;
    const next = {
      ...form,
      answers: form.answers.filter((answer) => answer.uid !== uid),
    };
    setForm(next);
    revalidate(next);
  }

  function handleValidationLink(event: React.MouseEvent<HTMLAnchorElement>, fieldId: string) {
    event.preventDefault();
    const target = document.getElementById(fieldId);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus({ preventScroll: true });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionAttempted(true);
    const nextErrors = validateForm(form, selectedFile, fileError);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || (form.mediaKind !== "text" && !selectedFile)) {
      window.requestAnimationFrame(() => validationSummaryRef.current?.focus());
      return;
    }

    const description = form.description.trim();
    const title = titleFromDescription(description);
    const filledAnswers = form.answers
      .map((answer) => answer.label.trim())
      .filter(Boolean);
    const answerOptions = filledAnswers.map((label, index) => ({
      id: `option-${index + 1}`,
      label,
      shortLabel: label,
      description: label,
    }));

    const draft: PublishedCaseDraft = {
      id: `draft-local-${draftSequence.current++}`,
      mediaKind: form.mediaKind,
      mediaFileName: selectedFile?.name,
      mediaFileSize: selectedFile?.size,
      mediaFileType: selectedFile?.type || undefined,
      mediaAlt: description,
      clipFileName: form.mediaKind === "video" ? selectedFile?.name : undefined,
      clipFileSize: form.mediaKind === "video" ? selectedFile?.size : undefined,
      clipFileType: form.mediaKind === "video" ? selectedFile?.type || "video/unknown" : undefined,
      clipStartTime: form.mediaKind === "video" ? "0" : undefined,
      clipEndTime: form.mediaKind === "video" ? "15" : undefined,
      posterFrameLabel:
        form.mediaKind === "video" ? "Poster frame selected during review" : undefined,
      title,
      prompt: "What is the correct decision?",
      description,
      competitionLevel: "Unspecified",
      difficulty: form.difficulty,
      category: form.category,
      originalDecision: form.originalDecision.trim(),
      scenarioStatus: "OPEN_DISCUSSION",
      answerOptions,
      recommendedDecision: "option-1",
      factors: [],
      criticalFactor: "",
      rulePath: [],
      ruleReference: "",
      expertExplanation: "",
      ruleset: "IFAB Laws of the Game",
      rulesetVersion: "2025/26",
      sourceType: "team-recorded",
      sourceAttribution: "Publisher submitted",
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
    answerSequence.current = 3;
    setForm(createInitialForm());
    setErrors({});
    setSubmissionAttempted(false);
    setSubmittedDraft(null);
    window.setTimeout(() => fileInputRef.current?.focus(), 0);
  }

  if (submittedDraft) {
    return (
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
        <h2 id="publish-success-title">Case submitted</h2>
        <p>Your draft is in the review queue. Experts can fill in rule path and reasoning later.</p>
        <div className="button-row">
          <button className="button" type="button" onClick={startAnotherDraft}>
            <RotateCcw aria-hidden="true" size={17} />
            Publish another
          </button>
        </div>
      </section>
    );
  }

  const errorEntries = Object.entries(errors);

  return (
    <form className="publisher-form" noValidate onSubmit={handleSubmit}>
      <section className="form-section" aria-labelledby="publish-basics">
        <div className="form-section__header">
          <div>
            <h2 id="publish-basics">Your case</h2>
            <p>Upload media, describe the incident, and list the calls learners can pick.</p>
          </div>
        </div>

        <fieldset className="media-kind-picker">
          <legend className="field-label">Format</legend>
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
              {form.mediaKind === "image" ? "Image" : "Clip"} <span aria-hidden="true">*</span>
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
                <strong>Drop a {form.mediaKind} here or choose a file</strong>
                <p id="clip-file-hint">
                  {form.mediaKind === "image" ? "JPEG, PNG, WebP, or GIF." : "MP4 or WebM."}
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
                      {selectedFile.type ? ` · ${selectedFile.type}` : ""}
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
                      aria-label={`Preview of ${selectedFile.name}`}
                      controls
                      playsInline
                      preload="metadata"
                      src={previewUrl}
                      style={{ height: "100%", objectFit: "contain", width: "100%" }}
                    >
                      <track
                        kind="captions"
                        label="No captions"
                        src="data:text/vtt;charset=utf-8,WEBVTT%0A%0A"
                        srcLang="en"
                      />
                    </video>
                  </div>
                ) : previewUrl && form.mediaKind === "image" ? (
                  <div className="case-media case-media--image">
                    <Image
                      alt={`Preview of ${selectedFile.name}`}
                      fill
                      sizes="(max-width: 900px) 100vw, 50vw"
                      src={previewUrl}
                      unoptimized
                    />
                  </div>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}

        <div>
          <label className="field-label" htmlFor="case-description">
            What happened <span aria-hidden="true">*</span>
          </label>
          <textarea
            aria-describedby={describedBy("case-description", errors)}
            aria-invalid={Boolean(errors["case-description"])}
            className="textarea"
            id="case-description"
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Late challenge near the touchline. Defender arrives after the ball is played…"
            required
            rows={4}
            value={form.description}
          />
          <FieldError fieldId="case-description" message={errors["case-description"]} />
        </div>

        <div className="form-grid">
          <div>
            <label className="field-label" htmlFor="incident-category">
              Category
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

        <fieldset className="choice-group" id="answer-options">
          <legend className="field-label">
            Answer choices <span aria-hidden="true">*</span>
          </legend>
          <span className="field-hint">At least two options.</span>
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
                    type="text"
                    value={answer.label}
                  />
                  <FieldError
                    fieldId={`answer-label-${answer.uid}`}
                    message={errors[`answer-label-${answer.uid}`]}
                  />
                </div>
                {form.answers.length > 2 ? (
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
          ) : null}
        </fieldset>

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
          <span>I have permission to share this material on ClearCall.</span>
        </label>
        <FieldError fieldId="permission-confirmed" message={errors["permission-confirmed"]} />

        {errorEntries.length > 0 ? (
          <div
            aria-labelledby="validation-summary-title"
            className="validation-summary"
            ref={validationSummaryRef}
            role="alert"
            tabIndex={-1}
          >
            <h2 id="validation-summary-title">
              Fix {errorEntries.length} {errorEntries.length === 1 ? "thing" : "things"} first
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

        <div className="permission-notice">
          <ShieldAlert aria-hidden="true" size={18} />
          <span>
            Submits for expert review. Rule reasoning and citations can be added later.
          </span>
        </div>

        <button className="button button--wide" disabled={!hydrated} type="submit">
          <Send aria-hidden="true" size={17} />
          Submit for review
        </button>
      </section>
    </form>
  );
}
