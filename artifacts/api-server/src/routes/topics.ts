import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, topicsTable, chaptersTable } from "@workspace/db";
import {
  CreateTopicBody,
  DeleteTopicParams,
  ListTopicsQueryParams,
  ListTopicsResponse,
  DeleteTopicResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/topics", async (req, res): Promise<void> => {
  const query = ListTopicsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const rows = await db
    .select({
      id: topicsTable.id,
      chapterId: topicsTable.chapterId,
      chapterName: chaptersTable.name,
      name: topicsTable.name,
      createdAt: topicsTable.createdAt,
    })
    .from(topicsTable)
    .innerJoin(chaptersTable, eq(topicsTable.chapterId, chaptersTable.id))
    .where(query.data.chapterId ? eq(topicsTable.chapterId, query.data.chapterId) : undefined)
    .orderBy(topicsTable.createdAt);

  res.json(ListTopicsResponse.parse(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))));
});

router.post("/topics", async (req, res): Promise<void> => {
  const parsed = CreateTopicBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [chapter] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, parsed.data.chapterId));
  if (!chapter) {
    res.status(404).json({ error: "Chapter not found" });
    return;
  }

  const [topic] = await db.insert(topicsTable).values(parsed.data).returning();
  res.status(201).json({ ...topic, chapterName: chapter.name, createdAt: topic.createdAt.toISOString() });
});

router.delete("/topics/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteTopicParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(topicsTable).where(eq(topicsTable.id, params.data.id));
  res.json(DeleteTopicResponse.parse({ success: true }));
});

export default router;
