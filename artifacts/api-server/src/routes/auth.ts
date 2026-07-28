import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateToken } from "../lib/auth";
import { z } from "zod";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);

    // In a real app, use bcrypt.compare here
    if (!user || user.passwordHash !== password) {
      res.status(401).json({ type: "about:blank", title: "Unauthorized", status: 401, detail: "Invalid username or password" });
      return;
    }

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000, // 1 hour
    });

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(400).json({ type: "about:blank", title: "Bad Request", status: 400, detail: "Invalid request body" });
  }
});

router.post("/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

export default router;
