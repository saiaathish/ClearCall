import type { AnswerOption, Distribution } from "@/lib/types";

export function DistributionBars({
  distribution,
  options,
  recommendedDecision,
  tone = "community",
}: {
  distribution: Distribution;
  options: readonly AnswerOption[];
  recommendedDecision: string;
  tone?: "community" | "verified" | "learner";
}) {
  return (
    <section
      className={`distribution-card ${tone === "verified" ? "distribution-card--verified" : ""}`}
      aria-label={distribution.label}
    >
      <div className="distribution-card__header">
        <h4>{distribution.label}</h4>
        <span>{distribution.isSynthetic ? "Seeded demo" : "Live responses"}</span>
      </div>
      <ul className="distribution-list">
        {options.map((option) => {
          const percentage = distribution.percentages[option.id] ?? 0;
          return (
            <li
              className="distribution-item"
              data-recommended={option.id === recommendedDecision || undefined}
              key={option.id}
            >
              <span>
                {option.shortLabel}
                {option.id === recommendedDecision ? " · demo recommendation" : ""}
              </span>
              <strong>{percentage}%</strong>
              <span className="distribution-bar" aria-hidden="true">
                <span style={{ width: `${percentage}%` }} />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
