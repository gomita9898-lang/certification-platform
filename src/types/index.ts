export type { Database, UserRole, Json } from "./database";

export type Locale = "pt" | "en";

export interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  is_published: boolean;
  pass_threshold: number;
  modules_count?: number;
  completed_modules?: number;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  content: string;
  video_url: string | null;
  order_index: number;
  is_published: boolean;
  status?: "locked" | "available" | "in_progress" | "completed";
  quiz_best_score?: number | null;
}

export interface Question {
  id: string;
  question: string;
  explanation: string | null;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  score: number;
  total_questions: number;
  passed: boolean;
  completed_at: string;
}

export interface ExamAttempt {
  id: string;
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
}

export interface Certificate {
  id: string;
  certificate_code: string;
  score_percentage: number;
  issued_at: string;
  course_title?: string;
  student_name?: string;
}

export interface StudentProgress {
  enrollment: {
    enrolled_at: string;
    completed_at: string | null;
  };
  modules: {
    total: number;
    completed: number;
    current_module_id: string | null;
  };
  exam: {
    attempts: number;
    best_score: number | null;
    passed: boolean;
  };
  certificate: Certificate | null;
}

export interface AdminStats {
  total_students: number;
  total_enrollments: number;
  completion_rate: number;
  average_exam_score: number;
  certificates_issued: number;
}
