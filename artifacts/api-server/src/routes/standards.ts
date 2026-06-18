import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, standardsTable, boardsTable } from "@workspace/db";
import {
  CreateStandardBody,
  DeleteStandardParams,
  ListStandardsQueryParams,
  ListStandardsResponse,
  DeleteStandardResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/standards", async (req, res): Promise<void> => {
  const query = ListStandardsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const rows = await db
    .select({
      id: standardsTable.id,
      boardId: standardsTable.boardId,
      boardName: boardsTable.name,
      name: standardsTable.name,
      createdAt: standardsTable.createdAt,
    })
    .from(standardsTable)
    .innerJoin(boardsTable, eq(standardsTable.boardId, boardsTable.id))
    .where(query.data.boardId ? eq(standardsTable.boardId, query.data.boardId) : undefined)
    .orderBy(standardsTable.createdAt);

  res.json(ListStandardsResponse.parse(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))));
});

router.post("/standards", async (req, res): Promise<void> => {
  const parsed = CreateStandardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [board] = await db.select().from(boardsTable).where(eq(boardsTable.id, parsed.data.boardId));
  if (!board) {
    res.status(404).json({ error: "Board not found" });
    return;
  }

  const [standard] = await db.insert(standardsTable).values(parsed.data).returning();
  res.status(201).json({ ...standard, boardName: board.name, createdAt: standard.createdAt.toISOString() });
});

router.delete("/standards/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteStandardParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(standardsTable).where(eq(standardsTable.id, params.data.id));
  res.json(DeleteStandardResponse.parse({ success: true }));
});

export default router;
