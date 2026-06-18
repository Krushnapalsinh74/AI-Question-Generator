import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { topicsTable } from "./topics";

export const quizSessionsTable = sqliteTable("quiz_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  topicId: integer("topic_id").notNull().references(() => topicsTable.id, { onDelete: "cascade" }),
  topicName: text("topic_name").notNull(),
  chapterName: text("chapter_name").notNull(),
  subjectName: text("subject_name").notNull(),
  standardName: text("standard_name").notNull(),
  boardName: text("board_name").notNull(),
  questionCount: integer("question_count").notNull(),
  difficulty: text("difficulty").notNull(),
  questions: text("questions", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertQuizSessionSchema = createInsertSchema(quizSessionsTable).omit({ id: true, createdAt: true });
export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type QuizSession = typeof quizSessionsTable.$inferSelect;
