export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "admin" | "student";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          locale?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          title_pt: string;
          title_en: string;
          description_pt: string;
          description_en: string;
          image_url: string | null;
          is_published: boolean;
          pass_threshold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title_pt: string;
          title_en: string;
          description_pt: string;
          description_en: string;
          image_url?: string | null;
          is_published?: boolean;
          pass_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title_pt?: string;
          title_en?: string;
          description_pt?: string;
          description_en?: string;
          image_url?: string | null;
          is_published?: boolean;
          pass_threshold?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      modules: {
        Row: {
          id: string;
          course_id: string;
          title_pt: string;
          title_en: string;
          description_pt: string;
          description_en: string;
          content_pt: string;
          content_en: string;
          video_url: string | null;
          order_index: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title_pt: string;
          title_en: string;
          description_pt: string;
          description_en: string;
          content_pt?: string;
          content_en?: string;
          video_url?: string | null;
          order_index: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          course_id?: string;
          title_pt?: string;
          title_en?: string;
          description_pt?: string;
          description_en?: string;
          content_pt?: string;
          content_en?: string;
          video_url?: string | null;
          order_index?: number;
          is_published?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          module_id: string | null;
          course_id: string;
          question_pt: string;
          question_en: string;
          explanation_pt: string | null;
          explanation_en: string | null;
          is_exam_question: boolean;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          module_id?: string | null;
          course_id: string;
          question_pt: string;
          question_en: string;
          explanation_pt?: string | null;
          explanation_en?: string | null;
          is_exam_question?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          module_id?: string | null;
          course_id?: string;
          question_pt?: string;
          question_en?: string;
          explanation_pt?: string | null;
          explanation_en?: string | null;
          is_exam_question?: boolean;
          order_index?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_module_id_fkey";
            columns: ["module_id"];
            referencedRelation: "modules";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
          {
            foreignKeyName: "questions_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
        ];
      };
      question_options: {
        Row: {
          id: string;
          question_id: string;
          text_pt: string;
          text_en: string;
          is_correct: boolean;
          order_index: number;
        };
        Insert: {
          id?: string;
          question_id: string;
          text_pt: string;
          text_en: string;
          is_correct?: boolean;
          order_index?: number;
        };
        Update: {
          question_id?: string;
          text_pt?: string;
          text_en?: string;
          is_correct?: boolean;
          order_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
        ];
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          enrolled_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          enrolled_at?: string;
          completed_at?: string | null;
        };
        Update: {
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
        ];
      };
      module_progress: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          course_id: string;
          status: "not_started" | "in_progress" | "completed";
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_id: string;
          course_id: string;
          status?: "not_started" | "in_progress" | "completed";
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "not_started" | "in_progress" | "completed";
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_progress_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
          {
            foreignKeyName: "module_progress_module_id_fkey";
            columns: ["module_id"];
            referencedRelation: "modules";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
          {
            foreignKeyName: "module_progress_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
        ];
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          course_id: string;
          score: number;
          total_questions: number;
          passed: boolean;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_id: string;
          course_id: string;
          score: number;
          total_questions: number;
          passed: boolean;
          completed_at?: string;
        };
        Update: {
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
          {
            foreignKeyName: "quiz_attempts_module_id_fkey";
            columns: ["module_id"];
            referencedRelation: "modules";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
          {
            foreignKeyName: "quiz_attempts_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
        ];
      };
      quiz_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_option_id: string;
          is_correct: boolean;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_option_id: string;
          is_correct: boolean;
        };
        Update: {
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey";
            columns: ["attempt_id"];
            referencedRelation: "quiz_attempts";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
        ];
      };
      exam_attempts: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          score: number;
          total_questions: number;
          percentage: number;
          passed: boolean;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          score: number;
          total_questions: number;
          percentage: number;
          passed: boolean;
          completed_at?: string;
        };
        Update: {
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_attempts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
          {
            foreignKeyName: "exam_attempts_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
        ];
      };
      exam_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_option_id: string;
          is_correct: boolean;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_option_id: string;
          is_correct: boolean;
        };
        Update: {
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_answers_attempt_id_fkey";
            columns: ["attempt_id"];
            referencedRelation: "exam_attempts";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
          {
            foreignKeyName: "exam_answers_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
        ];
      };
      certificates: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          exam_attempt_id: string;
          certificate_code: string;
          score_percentage: number;
          issued_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          exam_attempt_id: string;
          certificate_code: string;
          score_percentage: number;
          issued_at?: string;
        };
        Update: {
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "certificates_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
          {
            foreignKeyName: "certificates_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
          {
            foreignKeyName: "certificates_exam_attempt_id_fkey";
            columns: ["exam_attempt_id"];
            referencedRelation: "exam_attempts";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
        ];
      };
      app_settings: {
        Row: {
          key: string;
          value: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          updated_at?: string;
        };
        Update: {
          value?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
