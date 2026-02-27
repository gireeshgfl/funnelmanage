import { z } from "zod";

const QuestionSchema = z.object({
  id: z.string().length(24, "Invalid question ID format"),
  name: z.string().min(1, "Question name is required"),
});

export const TopicSchema = z.object({
  user_id: z.string().length(24, "Invalid user ID format"),
  data: z.object({
    topic: z.string().min(1, "Topic is required"),
    description: z.string().optional(),
  }),
});

export const TopicUpdateSchema = z.object({
  _id: z.string().length(24, "Invalid topic ID format"),
  topic: z.string().min(1, "Topic is required"),
  description: z.string().min(1, "Description is required"),
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
  status: z.enum(["Activate", "Deactivate", "ENDED"]).optional(),
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

const mcqAnswerSchema = z.object({
  text: z.string().min(1, "Answer text is required"),
  points: z.number().min(0, "Points must be non-negative"),
  isCorrect: z.boolean()
});

const mcqItemSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answers: z.array(mcqAnswerSchema).min(1, "At least one answer is required"),
  correctAnswerIndex: z.number().int().min(0, "Correct answer index must be non-negative"),
});

export const mcqArraySchema = z.object({
  mcqArray: z.array(mcqItemSchema).min(1, "At least one MCQ is required"),
  sessionId: z.string().length(24, "Invalid session ID format"),
});

export const participantEmailsSchema = z.object({
  sessionId: z.string().length(24, "Invalid session ID format"),
  emails: z.array(z.string().email("Invalid email address")).min(1, "At least one email is required"),
});

export const GroupSaveSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  studentIds: z.array(z.string().length(24, "Invalid student ID format")).min(1, "At least one student is required"),
});

export const AssignTrainerSchema = z.object({
  groupId: z.string().length(24, "Invalid group ID format"),
  trainerId: z.string().length(24, "Invalid trainer ID format"),
});

export const ReassignGroupSchema = z.object({
  group_id: z.string().length(24, "Invalid group ID format"),
});

export const RequestStudentToSessionSchema = z.object({
  student_id: z.string().length(24, "Invalid student ID format"),
  session_id: z.string().length(24, "Invalid session ID format"),
});
