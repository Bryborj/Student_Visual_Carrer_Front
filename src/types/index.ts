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
  subjects?: Subject[];
  levels?: PlanLevel[];
  [key: string]: any;
}

export interface PlanOption {
  career: string;
  faculty?: string;
}

export interface StudyPlanStats {
  passedCredits: number;
  totalCredits: number;
  percentage: number;
}

export interface ForumUser {
  username: string;
  emailHash: string;
}

export interface ForumComment {
  id: string;
  author: string;
  emailHash?: string;
  content: string;
  createdAt: string;
}

export interface ForumPost {
  _id?: string;
  title: string;
  content: string;
  category: string;
  career: string;
  author: string;
  emailHash?: string;
  likes: number;
  likedBy?: string[];
  comments: ForumComment[];
  createdAt: string;
}

