import { z } from "zod";

const QuestionSchema = z.object({
  id: z.string().length(24, "Invalid question ID format"),
  name: z.string().min(1, "Question name is required"),
  difficulty: z.enum(["Easy", "Medium", "Hard"], {
    message: "Difficulty must be one of: Easy, Medium, Hard",
  }),
});

export const TopicSchema = z.object({
  user_id: z.string().length(24, "Invalid user ID format"),
  data: z.object({
    topic: z.string().min(1, "Topic is required"),
    description: z.string().min(1, "Description is required"),
    difficulty: z.enum(["Easy", "Medium", "Hard"], {
      message: "Difficulty must be one of: Easy, Medium, Hard",
    }),
  }),
});

export const TopicUpdateSchema = z.object({
  _id: z.string().length(24, "Invalid topic ID format"),
  topic: z.string().min(1, "Topic is required"),
  description: z.string().min(1, "Description is required"),
  difficulty: z.enum(["Easy", "Medium", "Hard"], {
    message: "Difficulty must be one of: Easy, Medium, Hard",
  }),
});

export const SessionSchema = z.object({
  _id: z.string().length(24).optional(),
  sessionName: z.string().min(1, "Session name is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:mm)"),
  topic: z.string().min(1, "Topic is required"),
  questions: z.array(QuestionSchema).min(1, "At least one question is required"),
  additionalInfo: z.string().optional(),
});

export const UpdateSessionSchema = SessionSchema.partial().extend({
  status: z.enum(["Activate", "Deactivate"]).optional(),
  archived: z.string().optional(),
});

export const DeleteSessionSchema = z.object({
  _id: z.string().length(24, "Invalid ObjectId format"),
});

export const QuestionSaveSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answerMediaUrls: z.array(z.string().nullable()).optional(),
  answers: z.array(z.string()).min(1, "At least one answer is required"),
  correctAnswerIndex: z.number().int().min(0, "Correct answer index must be non-negative"),
  points: z.array(z.number()).min(1, "At least one point value is required"),
  questionText: z.string().optional(),
  questionType: z.string().min(1, "Question type is required"),
  topicId: z.string().length(24, "Invalid topic ID format"),
});

export const QuestionUpdateSchema = z.union([
  z.object({
    _id: z.string(),
    question: z.string(),
    answers: z.array(z.string()),
    points: z.array(z.number()),
    correctAnswerIndex: z.number().int().min(0),
    questionType: z.enum(["text-text"]),
  }),
  z.object({
    _id: z.string(),
    points: z.array(z.number()),
  }),
]);

export const QuestionDeleteSchema = z.object({
  questionId: z.string().length(24, "Invalid question ID format"),
});

export const pointsSaveSchema = z.object({
  questionId: z.string().length(24, "Invalid question ID format"),
  selectedAnswerIndex: z.number(),
  selectedAnswerText: z.string(),
  studentUserName: z.string(),
  studentUserId: z.string().length(24, "Invalid student ID format"),
  questionText: z.string(),
  sessionId: z.string().length(24, "Invalid student ID format"),
});

export const pushedQuestionSchema = z.object({
  topicId: z.string(),
  questionId: z.string(),
  sessionId: z.string()
});

export const chatMessageSchema = z.object({
  sender: z.string(),
  message: z.string(),
  sessionId: z.string(),
});

export const trainerStatusSchema = z.object({
  _id: z.string(),
  status: z.string(),
});

export const funnelDataSchema = z.object({
  userId: z.string().length(24, "userId must be a 24-character string"),
  username: z.string().min(1, "username is required"),
  sessionId: z.string().length(24, "sessionId must be a 24-character string"),
});