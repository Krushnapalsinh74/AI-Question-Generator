import { Router, type IRouter } from "express";
import { count, desc } from "drizzle-orm";
import { db, boardsTable, standardsTable, subjectsTable, chaptersTable, topicsTable, quizSessionsTable } from "@workspace/db";
import { GetDashboardStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [[boards], [standards], [subjects], [chapters], [topics], [quizzes], sessions] = await Promise.all([
    db.select({ value: count() }).from(boardsTable),
    db.select({ value: count() }).from(standardsTable),
    db.select({ value: count() }).from(subjectsTable),
    db.select({ value: count() }).from(chaptersTable),
    db.select({ value: count() }).from(topicsTable),
    db.select({ value: count() }).from(quizSessionsTable),
    db.select().from(quizSessionsTable).orderBy(desc(quizSessionsTable.createdAt)).limit(5),
  ]);

  const totalQuestions = sessions.reduce((acc, s) => acc + s.questionCount, 0);

  const allSessions = await db.select().from(quizSessionsTable).orderBy(desc(quizSessionsTable.createdAt)).limit(5);

  res.json(GetDashboardStatsResponse.parse({
    totalBoards: boards.value,
    totalStandards: standards.value,
    totalSubjects: subjects.value,
    totalChapters: chapters.value,
    totalTopics: topics.value,
    totalQuizzes: quizzes.value,
    totalQuestions: (await db.select().from(quizSessionsTable)).reduce((acc, s) => acc + s.questionCount, 0),
    recentQuizzes: allSessions.map(s => ({
      ...s,
      questions: s.questions as unknown[],
      createdAt: s.createdAt.toISOString(),
    })),
  }));
});

export default router;
