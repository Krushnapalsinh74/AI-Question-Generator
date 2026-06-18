import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, subjectsTable, standardsTable } from "@workspace/db";
import {
  CreateSubjectBody,
  DeleteSubjectParams,
  ListSubjectsQueryParams,
  ListSubjectsResponse,
  DeleteSubjectResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subjects", async (req, res): Promise<void> => {
  const query = ListSubjectsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const rows = await db
    .select({
      id: subjectsTable.id,
      standardId: subjectsTable.standardId,
      standardName: standardsTable.name,
      name: subjectsTable.name,
      createdAt: subjectsTable.createdAt,
    })
    .from(subjectsTable)
    .innerJoin(standardsTable, eq(subjectsTable.standardId, standardsTable.id))
    .where(query.data.standardId ? eq(subjectsTable.standardId, query.data.standardId) : undefined)
    .orderBy(subjectsTable.createdAt);

  res.json(ListSubjectsResponse.parse(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))));
});

router.post("/subjects", async (req, res): Promise<void> => {
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [standard] = await db.select().from(standardsTable).where(eq(standardsTable.id, parsed.data.standardId));
  if (!standard) {
    res.status(404).json({ error: "Standard not found" });
    return;
  }

  const [subject] = await db.insert(subjectsTable).values(parsed.data).returning();
  res.status(201).json({ ...subject, standardName: standard.name, createdAt: subject.createdAt.toISOString() });
});

router.delete("/subjects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteSubjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(subjectsTable).where(eq(subjectsTable.id, params.data.id));
  res.json(DeleteSubjectResponse.parse({ success: true }));
});

export default router;
