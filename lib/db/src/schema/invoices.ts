import { pgTable, serial, integer, text, real, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  invoiceNo: text("invoice_no"),
  invoiceDate: text("invoice_date"),
  qcPassSamples: integer("qc_pass_samples"),
  subtotal: real("subtotal"),
  gst: real("gst"),
  totalAmount: real("total_amount"),
  invoiceTatDays: integer("invoice_tat_days"),
  paymentStatus: text("payment_status").notNull().default("Pending"),
  invoiceFileId: integer("invoice_file_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    invoiceNoIdx: index("invoice_no_idx").on(table.invoiceNo),
    projectIdIdx: index("invoice_project_id_idx").on(table.projectId),
    paymentStatusIdx: index("payment_status_idx").on(table.paymentStatus),
  };
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
