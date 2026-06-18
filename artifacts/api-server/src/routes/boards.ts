import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, boardsTable } from "@workspace/db";
import {
  CreateBoardBody,
  DeleteBoardParams,
  ListBoardsResponse,
  DeleteBoardResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/boards", async (_req, res): Promise<void> => {
  const boards = await db.select().from(boardsTable).orderBy(boardsTable.createdAt);
  res.json(ListBoardsResponse.parse(boards.map(b => ({ ...b, createdAt: b.createdAt.toISOString() }))));
});

router.post("/boards", async (req, res): Promise<void> => {
  const parsed = CreateBoardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [board] = await db.insert(boardsTable).values(parsed.data).returning();
  res.status(201).json({ ...board, createdAt: board.createdAt.toISOString() });
});

router.delete("/boards/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteBoardParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(boardsTable).where(eq(boardsTable.id, params.data.id));
  res.json(DeleteBoardResponse.parse({ success: true }));
});

export default router;
