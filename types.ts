export enum EvaluationStatus {
  PASS = 'PASS',
  WARNING = 'WARNING',
  FAIL = 'FAIL',
}

export interface AuditSubItem {
  label: string;
  pass: boolean;
  details: string;
}

export interface CriterionResult {
  id: number;
  name: string;
  status: EvaluationStatus;
  observation: string; // Main summary
  items: AuditSubItem[]; // Detailed checklist table
  suggestions: string[];
}

export interface AuditReport {
  overallScore: number; // 0 to 100
  summary: string;
  criteriaResults: CriterionResult[];
  analyzedFileName: string;
}

export interface UploadState {
  isUploading: boolean;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

export type Language = 'es' | 'eu';

export const CRITERIA_LIST = [
  "Ajuste al currículum de Navarra",
  "Realización de cambios exigidos",
  "Redacción cercana y precisa",
  "Lenguaje no discriminatorio",
  "Ortografía y coherencia",
  "Licencias abiertas (CC)",
  "Citas y créditos",
  "Configuración de enlaces (Nueva pestaña)"
];