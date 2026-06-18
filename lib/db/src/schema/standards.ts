import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { boardsTable } from "./boards";

export const standardsTable = pgTable("standards", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").notNull().references(() => boardsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStandardSchema = createInsertSchema(standardsTable).omit({ id: true, createdAt: true });
export type InsertStandard = z.infer<typeof insertStandardSchema>;
export type Standard = typeof standardsTable.$inferSelect;
