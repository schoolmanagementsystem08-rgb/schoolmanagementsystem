import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { env } from './src/config/env';

// Set the AI SDK env from our config
if (env.GEMINI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = env.GEMINI_API_KEY;
}
import {
  healthRouter,
  studentsRouter,
  reportsRouter,
  classesRouter,
  attendanceRouter,
  gradesRouter,
  feesRouter,
  assignmentsRouter,
  announcementsRouter,
  messagesRouter,
  subjectsRouter,
  teachersRouter,
  authRouter,
  statsRouter,
  rolesRouter,
  adminUsersRouter,
} from './src/api';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler';
import { initializeDatabase } from './src/db';

async function startServer() {
  // Initialize database
  await initializeDatabase();

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Routes (must come before Vite SPA fallback)
  app.use('/api/health', healthRouter);
  app.use('/api/students', studentsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/classes', classesRouter);
  app.use('/api/attendance', attendanceRouter);
  app.use('/api/grades', gradesRouter);
  app.use('/api/fees', feesRouter);
  app.use('/api/assignments', assignmentsRouter);
  app.use('/api/announcements', announcementsRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/subjects', subjectsRouter);
  app.use('/api/teachers', teachersRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/roles', rolesRouter);
  app.use('/api/admin/users', adminUsersRouter);

  // AI endpoint
  app.post('/api/ai', async (req, res) => {
    try {
      const { prompt } = req.body;
      const result = await generateText({
        model: google("gemini-2.0-flash"),
        prompt: prompt || "Say hello",
      });
      res.json({ text: result.text });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development (SPA fallback — after API routes)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  const PORT = parseInt(env.PORT, 10);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
