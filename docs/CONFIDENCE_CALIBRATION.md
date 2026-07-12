# Confidence calibration

## Purpose

The confidence-calibration module measures how closely a referee's stated
confidence matches the correctness of their decisions. It provides deterministic
feedback for referee training and can be used by backend or frontend code
without a database, framework, or language model.

A single attempt is not enough to characterize a user's overall calibration.
Aggregate insights require a minimum number of attempts, three by default.

## Input contract

`DecisionAttempt` is the engine input:

```ts
interface DecisionAttempt {
  caseId: string;
  incidentCategory: string;
  selectedDecision: string;
  recommendedDecision: string;
  confidence: number; // 0 through 100
  createdAt?: string;
}
```

Confidence is supplied in percentage units from 0 through 100. The value must be
finite. Required strings must be nonempty. The engine does not mutate attempts
or the input array.

`StoredVoteAttempt` is an integration contract for backend records. The engine
does not read stored records directly. The backend should resolve
`recommendedDecision` from the trusted seeded case definition, then map the
record into `DecisionAttempt`.

The backend must not trust a client-supplied correct answer. Raw votes should
remain the source of truth; derived calibration metrics can be calculated on
demand for the MVP.

## Attempt-level output

`evaluateAttempt` returns:

| Field                   | Units   | Meaning                                                        |
| ----------------------- | ------- | -------------------------------------------------------------- |
| `isCorrect`             | boolean | Exact equality of `selectedDecision` and `recommendedDecision` |
| `confidence`            | 0–100   | Original referee confidence percentage                         |
| `confidenceProbability` | 0–1     | `confidence / 100`                                             |
| `calibrationError`      | 0–1     | Absolute distance between confidence probability and outcome   |
| `brierScore`            | 0–1     | Squared distance between confidence probability and outcome    |

Correctness uses:

```text
outcome = isCorrect ? 1 : 0
confidenceProbability = confidence / 100
calibrationError = abs(confidenceProbability - outcome)
brierScore = (confidenceProbability - outcome)^2
```

Values are not rounded internally.

## Aggregate output

`summarizeCalibration` returns the same overall metrics plus a deterministic
`classification`, `message`, and `categorySummaries` array.

| Field                     | Units             | Meaning                                       |
| ------------------------- | ----------------- | --------------------------------------------- |
| `attempts`                | count             | Number of attempts                            |
| `correctAttempts`         | count             | Correct attempts                              |
| `accuracy`                | 0–100             | `correctAttempts / attempts * 100`            |
| `averageConfidence`       | 0–100             | Mean confidence percentage                    |
| `calibrationGap`          | percentage points | `averageConfidence - accuracy`                |
| `averageCalibrationError` | 0–1               | Mean attempt-level absolute calibration error |
| `averageBrierScore`       | 0–1               | Mean attempt-level Brier score                |

Positive calibration gaps indicate confidence is higher than observed accuracy.
Negative gaps indicate confidence is lower than observed accuracy.

Default classification uses `minimumAttempts = 3` and
`wellCalibratedThreshold = 10` percentage points:

```text
attempts < minimumAttempts       -> insufficient_data
calibrationGap > threshold       -> overconfident
calibrationGap < -threshold      -> underconfident
otherwise                        -> well_calibrated
```

The threshold is inclusive at both boundaries: a gap of exactly +10 or -10 is
well calibrated. Custom options can change the minimum attempt count and
threshold.

For zero attempts, the module returns zero for every numeric metric,
`insufficient_data`, an honest minimum-data message, and an empty
`categorySummaries` array. It never returns `NaN` or `Infinity`.

## Example

Input:

```ts
[
  {
    caseId: "soccer-handball-001",
    incidentCategory: "handball",
    selectedDecision: "penalty-red-card",
    recommendedDecision: "penalty-red-card",
    confidence: 95,
  },
  {
    caseId: "soccer-handball-002",
    incidentCategory: "handball",
    selectedDecision: "penalty-no-card",
    recommendedDecision: "penalty-yellow-card",
    confidence: 80,
  },
  {
    caseId: "soccer-handball-003",
    incidentCategory: "handball",
    selectedDecision: "penalty-no-card",
    recommendedDecision: "penalty-no-card",
    confidence: 60,
  },
];
```

Output shape:

```ts
{
  attempts: 3,
  correctAttempts: 2,
  accuracy: 66.66666666666666,
  averageConfidence: 78.33333333333333,
  calibrationGap: 11.666666666666671,
  averageCalibrationError: 0.4166666666666667,
  averageBrierScore: 0.2675,
  classification: "overconfident",
  message: "You are overconfident across your decisions.",
  categorySummaries: [
    {
      incidentCategory: "handball",
      attempts: 3,
      correctAttempts: 2,
      accuracy: 66.66666666666666,
      averageConfidence: 78.33333333333333,
      calibrationGap: 11.666666666666671,
      averageCalibrationError: 0.4166666666666667,
      averageBrierScore: 0.2675,
      classification: "overconfident",
      message: "You are overconfident on handball decisions."
    }
  ]
}
```

Category summaries use the same metrics, thresholds, and minimum-attempt
behavior as the overall summary. Categories are sorted alphabetically for stable
output. Category messages are deterministic and contain no LLM-generated text.

## Backend integration contract for Aref

Before wiring the voting API, confirm that:

1. Raw votes are stored as the source of truth.
2. Confidence is stored as 0–100.
3. The backend resolves `recommendedDecision` from trusted seeded case data.
4. Stored vote records can be mapped into `DecisionAttempt`.
5. Calibration is calculated on demand for the MVP.
6. Derived profile metrics do not need to be persisted yet.
7. Field names align with the voting API.

The module does not persist data. It has no Supabase, React, HTTP, API, or LLM
dependency.

## Frontend fields for Arnav

The profile or result view can display `classification`, `message`, `accuracy`,
`averageConfidence`, `calibrationGap`, `averageCalibrationError`,
`averageBrierScore`, and the per-category `categorySummaries`.
`insufficient_data` should be shown as an honest prompt to complete more
decisions, not as a performance judgment.

## Current limitations

- Correctness is based on exact string equality after the backend supplies the
  trusted recommended decision.
- The initial model treats every attempt equally and does not apply time
  weighting, difficulty weighting, or confidence bands.
- Calibration classifications are aggregate heuristics, not proof of a stable
  user trait.
- The module calculates results only; persistence and user-level query
  orchestration remain backend responsibilities.
