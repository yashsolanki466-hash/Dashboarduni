import { db, projectsTable } from "@workspace/db";

async function run() {
  const projects = await db.select().from(projectsTable).limit(5);
  console.log("First 5 projects inside DB:");
  projects.forEach(p => {
    console.log(`Code: ${p.projectCode}, Status: "${p.status}"`);
  });
}

run().catch(console.error);
