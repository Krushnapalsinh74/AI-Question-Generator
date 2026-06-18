import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { boardsTable } from "./boards";

export const standardsTable = sqliteTable("standards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  boardId: integer("board_id").notNull().references(() => boardsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertStandardSchema = createInsertSchema(standardsTable).omit({ id: true, createdAt: true });
export type InsertStandard = z.infer<typeof insertStandardSchema>;
export type Standard = typeof standardsTable.$inferSelect;
