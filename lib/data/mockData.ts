import { SEED_EXAMS, SEED_SUBJECTS, SEED_QUESTIONS, SEED_PROFILES } from "./seed";

export const DEFAULT_EXAM_ID = "exam-neet-ug";
export const DEFAULT_EXAM_NAME = "NEET UG (Medical Entrance)";
export const DEFAULT_EXAM_SHORT_NAME = "NEET UG";

export const NEET_SUBJECTS = SEED_SUBJECTS.filter((s) => s.examination_id === DEFAULT_EXAM_ID);
export const NEET_QUESTIONS = SEED_QUESTIONS.filter((q) => q.examination_id === DEFAULT_EXAM_ID);

export const SEED_EXAMINATIONS = SEED_EXAMS;

export {
  SEED_EXAMS,
  SEED_SUBJECTS,
  SEED_QUESTIONS,
  SEED_PROFILES,
};
