import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bioinfoRecordsTable = pgTable("bioinfo_records", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().unique(), // link to projects without FK restriction to bypass locking
  status: text("status").notNull(), // 'Received in Run', 'Started Analysis', 'Analysis Steps', 'Report Generation', 'Submitted'
  pipelineStep: text("pipeline_step"), // Detailed step name, e.g. "Alignment", "Variant Calling", etc.
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBioinfoRecordSchema = createInsertSchema(bioinfoRecordsTable).omit({ id: true, updatedAt: true });
export type InsertBioinfoRecord = z.infer<typeof insertBioinfoRecordSchema>;
export type BioinfoRecord = typeof bioinfoRecordsTable.$inferSelect;
