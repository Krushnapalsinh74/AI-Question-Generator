import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, chaptersTable, subjectsTable } from "@workspace/db";
import {
  CreateChapterBody,
  DeleteChapterParams,
  ListChaptersQueryParams,
  ListChaptersResponse,
  DeleteChapterResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/chapters", async (req, res): Promise<void> => {
  const query = ListChaptersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const rows = await db
    .select({
      id: chaptersTable.id,
      subjectId: chaptersTable.subjectId,
      subjectName: subjectsTable.name,
      name: chaptersTable.name,
      createdAt: chaptersTable.createdAt,
    })
    .from(chaptersTable)
    .innerJoin(subjectsTable, eq(chaptersTable.subjectId, subjectsTable.id))
    .where(query.data.subjectId ? eq(chaptersTable.subjectId, query.data.subjectId) : undefined)
    .orderBy(chaptersTable.createdAt);

  res.json(ListChaptersResponse.parse(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))));
});

router.post("/chapters", async (req, res): Promise<void> => {
  const parsed = CreateChapterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, parsed.data.subjectId));
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  const [chapter] = await db.insert(chaptersTable).values(parsed.data).returning();
  res.status(201).json({ ...chapter, subjectName: subject.name, createdAt: chapter.createdAt.toISOString() });
});

router.delete("/chapters/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteChapterParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(chaptersTable).where(eq(chaptersTable.id, params.data.id));
  res.json(DeleteChapterResponse.parse({ success: true }));
});

export default router;
