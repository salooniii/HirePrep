import { create } from "zustand";

// Shape of one roadmap week — matches the JSON returned by the backend
export interface RoadmapWeek {
  week: string;
  theme: string;
  goal: string;
  skills: string[];
  resource: string;
  resourceUrl: string;
  milestone: string;
  outcomes: string[];
  color: string;
}

// Shape of one matched skill pair from gap_scorer
export interface MatchedSkill {
  jd: string;
  resume: string;
  score: number;
}

// Full analysis result returned by POST /analyze
export interface AnalysisResult {
  name: string;
  resume_skills: string[];
  jd_skills: string[];
  match_score: number;
  matched: MatchedSkill[];
  missing: string[];
  roadmap: RoadmapWeek[];
}

interface ResultStore {
  result: AnalysisResult | null;
  setResult: (result: AnalysisResult) => void;
  clear: () => void;
}

export const useResultStore = create<ResultStore>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clear: () => set({ result: null }),
}));
