"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleAlert,
  Search,
} from "lucide-react";
import { cases } from "@/data/cases";
import {
  areComparablePair,
  calculateSimilarity,
  findTeachingContrast,
  getComparablePeers,
} from "@/lib/algorithms";
import type { OfficiatingCase } from "@/lib/types";
import { useToast } from "@/components/toast-provider";
import { CaseVideo } from "@/components/case-video";
import { StatusBadge } from "@/components/status-badge";

function optionLabel(scenario: OfficiatingCase, optionId: string) {
  return scenario.answerOptions.find((option) => option.id === optionId)?.label ?? optionId;
}

function factorMap(scenario: OfficiatingCase) {
  return new Map(scenario.factors.map((factor) => [factor.key, factor] as const));
}

const comparableCases = cases.filter(
  (candidate) => getComparablePeers(candidate, cases).length > 0,
);

function makeDifferenceReason(a: OfficiatingCase, b: OfficiatingCase, differences: readonly string[]) {
  if (!areComparablePair(a, b)) {
    return "These cases are not an authored teaching pair, so their factor rows are context rather than a teaching-pair claim.";
  }
  if (differences.length > 0) {
    return `These cases are an authored teaching pair, but ${differences.slice(0, 2).join(" and ").toLowerCase()} change the teaching outcome.`;
  }
  return `Both cases follow a closely related factor pattern. Compare the rule path and competition context before deciding whether the same outcome applies.`;
}

export function CompareView({ initialA, initialB }: { initialA?: string; initialB?: string }) {
  const first = comparableCases.find((item) => item.id === initialA) ?? comparableCases[0];
  const firstPeers = getComparablePeers(first, cases);
  const initialContrast = findTeachingContrast(first, firstPeers);
  const requestedSecond = cases.find(
    (item) => item.id === initialB && areComparablePair(first, item),
  );
  const second =
    requestedSecond ??
    initialContrast?.case ??
    firstPeers[0] ??
    comparableCases[1];
  const [caseAId, setCaseAId] = useState(first.id);
  const [caseBId, setCaseBId] = useState(second.id);
  const { showToast } = useToast();

  const caseA = comparableCases.find((item) => item.id === caseAId) ?? comparableCases[0];
  const eligibleCases = getComparablePeers(caseA, cases);
  const caseB = eligibleCases.find((item) => item.id === caseBId) ?? eligibleCases[0];
  const similarity = calculateSimilarity(caseA, caseB);
  const automaticContrast = findTeachingContrast(caseA, eligibleCases);

  const mapA = factorMap(caseA);
  const mapB = factorMap(caseB);
  const factorKeys = [...new Set([...mapA.keys(), ...mapB.keys()])];
  const differenceLabels = factorKeys
    .filter((key) => mapA.get(key)?.value !== mapB.get(key)?.value)
    .map((key) => mapA.get(key)?.label ?? mapB.get(key)?.label ?? key);
  const reason =
    automaticContrast?.case.id === caseB.id
      ? automaticContrast.reason
      : makeDifferenceReason(caseA, caseB, differenceLabels);

  const findContrast = () => {
    const peers = getComparablePeers(caseA, cases);
    const contrast = findTeachingContrast(caseA, peers);
    if (!contrast) {
      showToast("No authored teaching pair is available for this case.");
      return;
    }
    setCaseBId(contrast.case.id);
    showToast(`Selected ${contrast.case.title} as the teaching pair contrast.`, "success");
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header__copy">
          <h1 className="page-title">Similar picture. Different weight.</h1>
          <p className="page-description">
            Compare teaching pairs side by side.
          </p>
        </div>
      </header>

      <section className="compare-controls" aria-label="Choose cases to compare">
        <div>
          <label className="field-label" htmlFor="case-a">Case A</label>
          <select className="select" id="case-a" value={caseA.id} onChange={(event) => {
            const nextCase = comparableCases.find((item) => item.id === event.target.value) ?? comparableCases[0];
            const peers = getComparablePeers(nextCase, cases);
            const nextContrast = findTeachingContrast(nextCase, peers);
            setCaseAId(nextCase.id);
            setCaseBId(nextContrast?.case.id ?? peers[0]?.id ?? comparableCases[1].id);
          }}>
            {comparableCases.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </div>
        <span className="compare-vs" aria-hidden="true">VS</span>
        <div>
          <label className="field-label" htmlFor="case-b">Case B</label>
          <select className="select" id="case-b" value={caseB.id} onChange={(event) => setCaseBId(event.target.value)}>
            {eligibleCases.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </div>
        <button className="button" type="button" onClick={findContrast}>
          <Search aria-hidden="true" size={16} /> Find teaching contrast
        </button>
      </section>

      <div className="compare-grid">
        <CompareCase scenario={caseA} label="Case A" />
        <CompareCase scenario={caseB} label="Case B" />
      </div>

      <section className="comparison-insight" aria-labelledby="comparison-insight-heading">
        <div>
          <h2 id="comparison-insight-heading">{reason}</h2>
        </div>
        <div className="similarity-score" aria-label={`${similarity.score} percent structural similarity`}>
          <span><strong>{similarity.score}%</strong><span>Similarity</span></span>
        </div>
      </section>

      <section aria-labelledby="factor-comparison-heading">
        <div className="content-section__header">
          <div>
            <h2 className="section-title" id="factor-comparison-heading">Factor comparison</h2>
          </div>
        </div>
        <div className="factor-table-wrap">
          <table className="factor-table">
            <thead><tr><th scope="col">Factor</th><th scope="col">Case A</th><th scope="col">Case B</th></tr></thead>
            <tbody>
              {factorKeys.map((key) => {
                const factorA = mapA.get(key);
                const factorB = mapB.get(key);
                const critical = key === caseA.criticalFactor || key === caseB.criticalFactor;
                return (
                  <tr data-critical={critical || undefined} key={key}>
                    <th scope="row">{factorA?.label ?? factorB?.label ?? key}</th>
                    <td>{factorA?.value ?? "Not recorded"}</td>
                    <td>{factorB?.value ?? "Not recorded"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="difference-callout">
        <CircleAlert aria-hidden="true" size={18} />
        <div>
          <strong>Critical distinction</strong>
          <p>{makeDifferenceReason(caseA, caseB, differenceLabels)}</p>
        </div>
      </div>
    </div>
  );
}

function CompareCase({ scenario, label }: { scenario: OfficiatingCase; label: string }) {
  return (
    <article className="compare-case">
      <CaseVideo scenario={scenario} />
      <div className="compare-case__body">
        <div className="compare-case__label"><span>{label}</span><StatusBadge status={scenario.scenarioStatus} /></div>
        <h2>{scenario.title}</h2>
        <div className="meta-row"><span className="meta-chip">{scenario.category}</span><span className="meta-chip">{scenario.difficulty}</span></div>
        <div className="compare-decision">
          <span>Demo recommendation<strong>{optionLabel(scenario, scenario.recommendedDecision)}</strong></span>
          <span>Rule reference<strong>{scenario.ruleReference}</strong></span>
          <span>Rule path<strong>{scenario.rulePath.at(-1)}</strong></span>
        </div>
        <Link className="text-link" href={`/case/${scenario.id}`}>Open full case <ArrowRight aria-hidden="true" size={14} /></Link>
      </div>
    </article>
  );
}
