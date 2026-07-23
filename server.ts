import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { env } from './src/config/env';
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

  // Vite middleware for development
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

  // API Routes
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

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  const PORT = parseInt(env.PORT, 10);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
