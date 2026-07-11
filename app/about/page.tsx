import type { Metadata } from "next";
import {
  AlertTriangle,
  BadgeCheck,
  FileWarning,
  Scale,
  Video,
} from "lucide-react";
import { DEMO_REVIEW_DISCLAIMER } from "@/data/cases";

export const metadata: Metadata = {
  title: "About & trust",
  description:
    "How ClearCall separates discussion, reviewer evidence, decision status, and demonstration material.",
};

const learningDisclaimer =
  "ClearCall supports learning and discussion. It does not replace official certification or governing-body instruction.";

const trainingLoop = ["Watch", "Decide", "Explain", "Reveal", "Compare", "Improve"];

export default function AboutPage() {
  return (
    <div className="page-shell page-shell--narrow">
      <header className="about-lead">
        <div>
          <p className="eyebrow">About · trust model</p>
          <h1>
            Decision training with a visible <span>evidence trail.</span>
          </h1>
        </div>
        <p>
          ClearCall is a public, short-form decision-training prototype for aspiring and
          active sports officials. Learners make a call, record their confidence and
          reasoning, then compare the factors behind different decisions. Educators,
          officials, coaches, and fans can use the same structure to discuss why a call
          changes—not only which option received the most votes.
        </p>
      </header>

      <div className="product-loop" role="list" aria-label="ClearCall training loop">
        {trainingLoop.map((step, index) => (
          <div
            className="product-loop__step"
            data-accent={step === "Reveal" ? "" : undefined}
            role="listitem"
            key={step}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>

      <p className="eyebrow">What each decision status means</p>
      <section className="trust-grid" aria-label="Decision status meanings">
        <article className="trust-card trust-card--verified">
          <span className="trust-card__number" aria-hidden="true">
            01
          </span>
          <h2>Verified ruling</h2>
          <p>
            Reserved for an outcome confirmed against the applicable published rules by
            a qualified, verified reviewer or an identified governing-body source. The
            source and ruleset version should remain visible with the ruling.
          </p>
        </article>

        <article className="trust-card trust-card--consensus">
          <span className="trust-card__number" aria-hidden="true">
            02
          </span>
          <h2>Expert consensus</h2>
          <p>
            Qualified reviewers broadly agree on the recommended decision, while the
            incident may still involve interpretation. Consensus is useful training
            evidence, but it is not official guidance unless an official source says so.
          </p>
        </article>

        <article className="trust-card trust-card--open">
          <span className="trust-card__number" aria-hidden="true">
            03
          </span>
          <h2>Open discussion</h2>
          <p>
            The case is unresolved, interpretive, or has not received qualified review.
            Public responses can surface reasoning and disagreement; they do not create
            an authoritative answer by popularity.
          </p>
        </article>
      </section>

      <section className="about-sections" aria-label="Evidence and publishing policy">
        <article className="about-section">
          <span className="about-section__icon">
            <BadgeCheck aria-hidden="true" size={19} />
          </span>
          <h2>How authority is determined</h2>
          <p>
            In the intended trust model, authority comes from a named source and review
            process—not vote count. A qualified reviewer checks the incident facts,
            applicable ruleset and version, rule citation, and recommended outcome before
            a case can carry a verified status.
          </p>
          <p>
            This frontend prototype does not implement production credential
            verification, moderation, or governing-body approval.
          </p>
        </article>

        <article className="about-section">
          <span className="about-section__icon">
            <Scale aria-hidden="true" size={19} />
          </span>
          <h2>Public and reviewer evidence stay separate</h2>
          <p>
            Public results answer, “How did the wider community decide?” Verified-reviewer
            results answer, “How did qualified officials assess the case?” Keeping the
            distributions separate makes disagreement visible without presenting a public
            majority as verified truth.
          </p>
          <p>
            In this demo, every displayed distribution is authored and synthetic; none is
            a count of real community or verified-reviewer responses.
          </p>
        </article>

        <article className="about-section">
          <span className="about-section__icon">
            <Video aria-hidden="true" size={19} />
          </span>
          <h2>Authorized footage only</h2>
          <p>
            ClearCall is designed for team-recorded, openly licensed, or otherwise
            authorized footage. A discussion may point to an attributed external source
            where that platform and the rights holder permit it; it is not permission to
            scrape, copy, or rehost professional broadcasts.
          </p>
          <p>
            A production service would also need attribution, rights review, reporting,
            and removal workflows. Those workflows are not implemented in this prototype.
          </p>
        </article>

        <article className="about-section">
          <span className="about-section__icon">
            <FileWarning aria-hidden="true" size={19} />
          </span>
          <h2>The current demo boundary</h2>
          <p>{DEMO_REVIEW_DISCLAIMER}</p>
          <p>
            The status definitions above document the intended product model. The seeded
            dataset remains marked for review and does not claim that credential checks or
            qualified expert review have occurred.
          </p>
        </article>
      </section>

      <aside className="disclaimer" aria-labelledby="learning-boundary-title">
        <AlertTriangle aria-hidden="true" size={20} />
        <div>
          <strong id="learning-boundary-title">Learning boundary</strong>
          <p>{learningDisclaimer}</p>
        </div>
      </aside>
    </div>
  );
}
