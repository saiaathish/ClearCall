export interface DecisionAttempt {
  caseId: string;
  incidentCategory: string;
  selectedDecision: string;
  recommendedDecision: string;
  confidence: number;
  createdAt?: string;
}

export interface StoredVoteAttempt {
  id: string;
  userId: string;
  caseId: string;
  selectedDecision: string;
  confidence: number;
  incidentCategory: string;
  createdAt: string;
}

export interface AttemptCalibration {
  caseId: string;
  incidentCategory: string;
  selectedDecision: string;
  recommendedDecision: string;
  isCorrect: boolean;
  confidence: number;
  confidenceProbability: number;
  calibrationError: number;
  brierScore: number;
}

export interface CalibrationOptions {
  minimumAttempts?: number;
  wellCalibratedThreshold?: number;
}

export type CalibrationClassification =
  "well_calibrated" | "overconfident" | "underconfident" | "insufficient_data";

export interface CategoryCalibrationSummary {
  incidentCategory: string;
  attempts: number;
  correctAttempts: number;
  accuracy: number;
  averageConfidence: number;
  calibrationGap: number;
  averageCalibrationError: number;
  averageBrierScore: number;
  classification: CalibrationClassification;
  message: string;
}

export interface CalibrationSummary {
  attempts: number;
  correctAttempts: number;
  accuracy: number;
  averageConfidence: number;
  calibrationGap: number;
  averageCalibrationError: number;
  averageBrierScore: number;
  classification: CalibrationClassification;
  message: string;
  categorySummaries: CategoryCalibrationSummary[];
}
