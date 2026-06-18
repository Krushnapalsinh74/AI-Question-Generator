import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const boardsTable = pgTable("boards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBoardSchema = createInsertSchema(boardsTable).omit({ id: true, createdAt: true });
export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type Board = typeof boardsTable.$inferSelect;
