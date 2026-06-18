import { pgTable, serial, timestamp, integer, text, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { topicsTable } from "./topics";

export const quizSessionsTable = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => topicsTable.id, { onDelete: "cascade" }),
  topicName: text("topic_name").notNull(),
  chapterName: text("chapter_name").notNull(),
  subjectName: text("subject_name").notNull(),
  standardName: text("standard_name").notNull(),
  boardName: text("board_name").notNull(),
  questionCount: integer("question_count").notNull(),
  difficulty: text("difficulty").notNull(),
  questions: jsonb("questions").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQuizSessionSchema = createInsertSchema(quizSessionsTable).omit({ id: true, createdAt: true });
export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type QuizSession = typeof quizSessionsTable.$inferSelect;
