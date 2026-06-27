export type SubjectStatus = 'PASSED' | 'AVAILABLE' | 'LOCKED';

export interface Subject {
  subject: string;
  code?: string;
  credits: number;
  prerequisites?: string[];
  corequisites?: string[];
  unlockCode?: string;
  requiredCredits?: number;
  level?: number | string;
  [key: string]: any;
}

export interface PlanLevel {
  level: number | string;
  subjects: Subject[];
}

export interface PlanData {
  _id?: string;
  career: string;
  faculty?: string;
  modalidad?: string;
  subjects?: Subject[];
  levels?: PlanLevel[];
  [key: string]: any;
}

export interface PlanOption {
  career: string;
  faculty?: string;
  modalidad?: string;
}

export interface StudyPlanStats {
  passedCredits: number;
  totalCredits: number;
  percentage: number;
}
