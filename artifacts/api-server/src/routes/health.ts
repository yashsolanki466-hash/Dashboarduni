import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import os from "os";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  let dbStatus = "ok";
  try {
    const client = await pool.connect();
    client.release();
  } catch (error) {
    dbStatus = "error";
    res.status(503).json({
      status: "error",
      message: "Database connection failed",
      details: process.env.NODE_ENV === "development" ? error : undefined
    });
    return;
  }

  const memoryUsage = process.memoryUsage();
  const freeMemory = os.freemem();
  const totalMemory = os.totalmem();

  res.json({
    status: "ok",
    dbStatus,
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      free: freeMemory,
      total: totalMemory,
    }
  });
});

export default router;
