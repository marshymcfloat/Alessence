// Client-safe exports - types and enums only
// This file can be safely imported in client components

// Export enums
export {
  SemesterEnum,
  TaskStatusEnum,
  AcceptedFileType,
  ExamStatusEnum,
  QuestionTypeEnum,
  AttemptStatusEnum,
  SummaryStatusEnum,
  SummaryTemplateEnum,
  SessionTypeEnum,
  SessionStatusEnum,
  GoalPeriodEnum,
} from "@prisma/client";

// Export types (type-only exports)
export type {
  User,
  Subject,
  File,
  Exam,
  Question,
  ExamAttempt,
  UserAnswer,
  Task,
  Summary,
  StudySession,
  StudyGoal,
  FlashcardDeck,
  Flashcard,
  FlashcardReview,
  Note,
  Tag,
  NoteTag,
  Prisma,
} from "@prisma/client";

