"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";
import { cases } from "@/data/cases";
import type { OfficiatingCase } from "@/lib/types";
import { useDemo } from "@/context/demo-context";
import { CaseVideo } from "@/components/case-video";
import { StatusBadge } from "@/components/status-badge";

function optionLabel(scenario: OfficiatingCase, optionId: string) {
  return scenario.answerOptions.find((option) => option.id === optionId)?.label ?? optionId;
}

function criticalFactor(scenario: OfficiatingCase) {
  return scenario.factors.find((factor) => factor.key === scenario.criticalFactor);
}

export function CompareView({ initialCaseId }: { initialCaseId?: string }) {
  const { answers } = useDemo();
  const first = cases.find((item) => item.id === initialCaseId) ?? cases[0];
  const [caseId, setCaseId] = useState(first.id);

  const scenario = cases.find((item) => item.id === caseId) ?? cases[0];
  const answer = answers[scenario.id];
  const critical = criticalFactor(scenario);
  const supportingFactors = scenario.factors.filter((factor) => factor.supportsRecommendation);
  const callsDiffer =
    scenario.originalDecision.trim().toLowerCase() !==
    optionLabel(scenario, scenario.recommendedDecision).trim().toLowerCase();

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header__copy">
          <h1 className="page-title">Same incident. Different reads.</h1>
          <p className="page-description">
            Compare the match call with the authored demo recommendation.
          </p>
        </div>
      </header>

      <section className="compare-controls" aria-label="Choose a case to compare">
        <div>
          <label className="field-label" htmlFor="compare-case">Case</label>
          <select
            className="select"
            id="compare-case"
            value={scenario.id}
            onChange={(event) => setCaseId(event.target.value)}
          >
            {cases.map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </select>
        </div>
        {answer && (
          <div className="compare-your-call" aria-label="Your recorded call">
            <span>Your call</span>
            <strong>{optionLabel(scenario, answer.selectedOptionId)}</strong>
            <span>{answer.confidence}% confidence</span>
          </div>
        )}
      </section>

      <div className="compare-grid">
        <article className="compare-case">
          <CaseVideo scenario={scenario} />
          <div className="compare-case__body">
            <div className="compare-case__label">
              <span>Match referee</span>
              <StatusBadge status={scenario.scenarioStatus} />
            </div>
            <h2>{scenario.title}</h2>
            <div className="meta-row">
              <span className="meta-chip">{scenario.category}</span>
              <span className="meta-chip">{scenario.difficulty}</span>
            </div>
            <div className="compare-decision">
              <span>On-field call<strong>{scenario.originalDecision}</strong></span>
              <span>Competition<strong>{scenario.competitionLevel}</strong></span>
              <span>Source<strong>{scenario.sourceType}</strong></span>
            </div>
            <p className="compare-side-note">
              This is the call made in the match. Use it as the starting point, then weigh the authored factors on the right.
            </p>
          </div>
        </article>

        <article className="compare-case">
          <CaseVideo scenario={scenario} />
          <div className="compare-case__body">
            <div className="compare-case__label">
              <span>Expert / demo</span>
              <StatusBadge status={scenario.scenarioStatus} />
            </div>
            <h2>{scenario.title}</h2>
            <div className="meta-row">
              <span className="meta-chip">{scenario.category}</span>
              <span className="meta-chip">{scenario.difficulty}</span>
            </div>
            <div className="compare-decision">
              <span>Demo recommendation<strong>{optionLabel(scenario, scenario.recommendedDecision)}</strong></span>
              <span>Rule reference<strong>{scenario.ruleReference}</strong></span>
              <span>Critical factor<strong>{critical ? `${critical.label}: ${critical.value}` : scenario.criticalFactor}</strong></span>
            </div>
            <p className="compare-side-note">{scenario.expertExplanation}</p>
          </div>
        </article>
      </div>

      {callsDiffer && (
        <div className="difference-callout">
          <CircleAlert aria-hidden="true" size={18} />
          <div>
            <strong>Where the reads diverge</strong>
            <p>
              The match call was {scenario.originalDecision}; the authored demo recommends{" "}
              {optionLabel(scenario, scenario.recommendedDecision)}.
              {critical
                ? ` The critical factor is ${critical.label.toLowerCase()} (${critical.value}).`
                : ""}
            </p>
          </div>
        </div>
      )}

      <section aria-labelledby="supporting-factors-heading">
        <div className="content-section__header">
          <div>
            <h2 className="section-title" id="supporting-factors-heading">Factors supporting the demo call</h2>
          </div>
        </div>
        <div className="factor-table-wrap">
          <table className="factor-table">
            <thead>
              <tr>
                <th scope="col">Factor</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {supportingFactors.map((factor) => (
                <tr
                  data-critical={factor.key === scenario.criticalFactor || undefined}
                  key={factor.key}
                >
                  <th scope="row">{factor.label}</th>
                  <td>{factor.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p>
        <Link className="text-link" href={`/case/${scenario.id}`}>
          Open full case <ArrowRight aria-hidden="true" size={14} />
        </Link>
      </p>
    </div>
  );
}
