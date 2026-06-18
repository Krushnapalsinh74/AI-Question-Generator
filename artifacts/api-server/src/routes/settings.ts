import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import {
  SaveSettingsBody,
  GetSettingsResponse,
  SaveSettingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/settings", async (_req, res): Promise<void> => {
  const rows = await db.select().from(settingsTable).limit(1);
  if (rows.length === 0) {
    res.json(GetSettingsResponse.parse({ apiKey: null, provider: "openai", model: "gpt-4o", hasKey: false }));
    return;
  }
  const s = rows[0];
  res.json(GetSettingsResponse.parse({
    apiKey: s.apiKey ? "••••••••" : null,
    provider: s.provider,
    model: s.model,
    hasKey: !!s.apiKey,
  }));
});

router.put("/settings", async (req, res): Promise<void> => {
  const parsed = SaveSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rows = await db.select().from(settingsTable).limit(1);

  let saved;
  if (rows.length === 0) {
    const [inserted] = await db.insert(settingsTable).values({
      apiKey: parsed.data.apiKey,
      provider: parsed.data.provider,
      model: parsed.data.model,
    }).returning();
    saved = inserted;
  } else {
    const [updated] = await db.update(settingsTable).set({
      apiKey: parsed.data.apiKey,
      provider: parsed.data.provider,
      model: parsed.data.model,
    }).returning();
    saved = updated;
  }

  res.json(SaveSettingsResponse.parse({
    apiKey: saved.apiKey ? "••••••••" : null,
    provider: saved.provider,
    model: saved.model,
    hasKey: !!saved.apiKey,
  }));
});

export default router;
