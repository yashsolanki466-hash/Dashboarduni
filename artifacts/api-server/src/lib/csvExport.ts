import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  db,
  projectsTable,
  clientsTable,
  servicesTable,
  scientistsTable,
  salesPersonsTable,
  territoriesTable,
  qcRecordsTable,
  bioinfoRecordsTable,
} from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { logger } from "./logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const exportPath = path.resolve(__dirname, "../../../../unipath_projects_live.csv");

// Project select with joins
const projectSelect = {
  projectCode: projectsTable.projectCode,
  date: projectsTable.date,
  month: projectsTable.month,
  labSubmissionDate: projectsTable.labSubmissionDate,
  scientistName: scientistsTable.name,
  clientName: clientsTable.name,
  billingClientName: clientsTable.billingName,
  serviceName: servicesTable.name,
  serviceHead: servicesTable.serviceHead,
  sampleType: projectsTable.sampleType,
  withAnalysis: projectsTable.withAnalysis,
  noOfSamples: projectsTable.noOfSamples,
  dataRequirement: projectsTable.dataRequirement,
  gbPerSample: projectsTable.gbPerSample,
  totalGb: projectsTable.totalGb,
  ratePerSample: projectsTable.ratePerSample,
  totalAmount: projectsTable.totalAmount,
  gst: projectsTable.gst,
  totalProjectCost: projectsTable.totalProjectCost,
  quotationNo: projectsTable.quotationNo,
  salesPersonName: salesPersonsTable.name,
  territoryName: territoriesTable.name,
  city: projectsTable.city,
  status: projectsTable.status,
  remark: projectsTable.remark,
  runNo: qcRecordsTable.runNo,
  bioinfoStatus: bioinfoRecordsTable.status,
  bioinfoPipelineStep: bioinfoRecordsTable.pipelineStep,
};

export async function exportProjectsToCsv() {
  try {
    const data = await db
      .select(projectSelect)
      .from(projectsTable)
      .leftJoin(scientistsTable, eq(projectsTable.scientistId, scientistsTable.id))
      .leftJoin(servicesTable, eq(projectsTable.serviceId, servicesTable.id))
      .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
      .leftJoin(salesPersonsTable, eq(projectsTable.salesPersonId, salesPersonsTable.id))
      .leftJoin(territoriesTable, eq(projectsTable.territoryId, territoriesTable.id))
      .leftJoin(qcRecordsTable, eq(projectsTable.id, qcRecordsTable.projectId))
      .leftJoin(bioinfoRecordsTable, eq(projectsTable.id, bioinfoRecordsTable.projectId))
      .orderBy(desc(projectsTable.date));

    const csvHeaders = [
      "Project ID", "Date", "Month", "Lab Process Submission Date", "Scientist Name",
      "Institute/Client Name", "Billing Name", "Service Name", "Service Head", "Sample Type",
      "With/Without Analysis", "No. of Samples", "Data Requirement", "GB Data Output", "Total GB Data Output",
      "Rate Per Sample", "Total Amount", "GST", "Total Project Cost", "Quotation/GEM No",
      "Sales Person", "Territory Name", "City", "Status", "Remark", "Run No",
      "Bioinfo Status", "Bioinfo Pipeline Step"
    ];

    const rows = [csvHeaders.join(",")];

    for (const p of data) {
      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return "";
        const str = String(val).replace(/"/g, '""');
        return str.includes(",") || str.includes("\n") || str.includes('"') ? `"${str}"` : str;
      };

      const rowValues = [
        escapeCsv(p.projectCode),
        escapeCsv(p.date),
        escapeCsv(p.month),
        escapeCsv(p.labSubmissionDate),
        escapeCsv(p.scientistName),
        escapeCsv(p.clientName),
        escapeCsv(p.billingClientName),
        escapeCsv(p.serviceName),
        escapeCsv(p.serviceHead),
        escapeCsv(p.sampleType),
        escapeCsv(p.withAnalysis),
        p.noOfSamples != null ? p.noOfSamples.toString() : "",
        escapeCsv(p.dataRequirement),
        p.gbPerSample != null ? p.gbPerSample.toString() : "",
        p.totalGb != null ? p.totalGb.toString() : "",
        p.ratePerSample != null ? p.ratePerSample.toString() : "",
        p.totalAmount != null ? p.totalAmount.toString() : "",
        p.gst != null ? p.gst.toString() : "",
        p.totalProjectCost != null ? p.totalProjectCost.toString() : "",
        escapeCsv(p.quotationNo),
        escapeCsv(p.salesPersonName),
        escapeCsv(p.territoryName),
        escapeCsv(p.city),
        escapeCsv(p.status),
        escapeCsv(p.remark),
        escapeCsv(p.runNo),
        escapeCsv(p.bioinfoStatus),
        escapeCsv(p.bioinfoPipelineStep),
      ];

      rows.push(rowValues.join(","));
    }

    fs.writeFileSync(exportPath, rows.join("\n"), "utf8");
    logger.info({ path: exportPath }, "Successfully synchronized live CSV export file");
  } catch (err) {
    logger.error({ err }, "Error synchronizing live CSV export file");
  }
}
