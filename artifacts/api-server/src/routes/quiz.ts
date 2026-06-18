import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, topicsTable, chaptersTable, subjectsTable, standardsTable, boardsTable, settingsTable, quizSessionsTable } from "@workspace/db";
import {
  GenerateQuizBody,
  GenerateQuizResponse,
  ListQuizHistoryResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

function extractQuestionsFromObj(obj: unknown): unknown[] {
  if (Array.isArray(obj)) return obj;
  const o = obj as Record<string, unknown>;
  if (Array.isArray(o.questions)) return o.questions as unknown[];
  throw new Error("questions array not found in response");
}

function repairJson(text: string): string {
  // Step 1: Replace raw control characters inside JSON strings (actual tabs, newlines etc.)
  // Step 2: Fix bare backslashes not part of a valid JSON escape sequence
  // Valid JSON escapes after \: " \ / b f n r t u
  // We also need to NOT double-escape already-doubled backslashes.

  // First, aggressively fix all backslash issues by processing char by char:
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\") {
      const next = text[i + 1];
      if (next === '"' || next === "\\" || next === "/" ||
          next === "b" || next === "f" || next === "n" ||
          next === "r" || next === "t") {
        // Valid 2-char escape — keep as-is
        out += ch + next;
        i += 2;
      } else if (next === "u" && /[0-9a-fA-F]{4}/.test(text.slice(i + 2, i + 6))) {
        // Valid \uXXXX — keep as-is
        out += text.slice(i, i + 6);
        i += 6;
      } else {
        // Invalid escape — double the backslash
        out += "\\\\";
        i += 1;
      }
    } else {
      // Escape raw control characters that are illegal inside JSON strings
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        if (code === 0x09) out += "\\t";
        else if (code === 0x0a) out += "\\n";
        else if (code === 0x0d) out += "\\r";
        else out += `\\u${code.toString(16).padStart(4, "0")}`;
      } else {
        out += ch;
      }
      i++;
    }
  }
  return out;
}

function parseAIQuestions(raw: string): unknown[] {
  // Strategy 1: parse as-is
  const trimmed = raw.trim();
  try {
    return extractQuestionsFromObj(JSON.parse(trimmed));
  } catch (_) { /* try next */ }

  // Strategy 2: strip markdown code fences (anywhere in text)
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const fenced = fenceMatch ? fenceMatch[1].trim() : trimmed;
  if (fenced !== trimmed) {
    try {
      return extractQuestionsFromObj(JSON.parse(fenced));
    } catch (_) { /* try next */ }
  }

  // Strategy 3: extract the outermost JSON object by finding first { and last }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const extracted = start !== -1 && end > start ? trimmed.slice(start, end + 1) : fenced;

  // Strategy 4: repair backslash escapes and control characters, then parse
  const repaired = repairJson(extracted);
  return extractQuestionsFromObj(JSON.parse(repaired));
}

const router: IRouter = Router();

async function callAI(apiKey: string, provider: string, model: string, prompt: string): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  let url: string;
  let body: object;

  if (provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages";
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
    body = {
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    };
  } else if (provider === "gemini") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    };
  } else {
    // OpenAI (default)
    url = "https://api.openai.com/v1/chat/completions";
    headers["Authorization"] = `Bearer ${apiKey}`;
    body = {
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert educator and exam question creator. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
    };
  }

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI API error (${resp.status}): ${errText}`);
  }

  const data = await resp.json() as Record<string, unknown>;

  if (provider === "anthropic") {
    const content = (data.content as Array<{ type: string; text: string }>);
    return content[0].text;
  } else if (provider === "gemini") {
    const candidates = (data.candidates as Array<{ content: { parts: Array<{ text: string }> } }>);
    return candidates[0].content.parts[0].text;
  } else {
    const choices = (data.choices as Array<{ message: { content: string } }>);
    return choices[0].message.content;
  }
}

function buildPrompt(
  topicName: string,
  chapterName: string,
  subjectName: string,
  standardName: string,
  boardName: string,
  questionCount: number,
  difficulty: string,
): string {
  const difficultyGuide =
    difficulty === "easy"
      ? "straightforward recall and basic comprehension questions appropriate for beginners"
      : difficulty === "medium"
      ? "application and analysis questions requiring understanding, not just memorization"
      : "challenging, higher-order thinking questions involving synthesis, evaluation, and complex problem-solving strictly within the curriculum scope — do NOT go out of syllabus, but push depth and complexity to the maximum within it";

  return `You are an expert exam question creator for the ${boardName} board, ${standardName} standard, ${subjectName} subject.

Generate exactly ${questionCount} ${difficulty.toUpperCase()} difficulty questions for the topic: "${topicName}" (Chapter: "${chapterName}").

Difficulty guidance: ${difficultyGuide}

IMPORTANT RULES:
- Stay strictly within the topic "${topicName}" — do not include questions from outside this topic
- For "${difficulty}" difficulty: ${difficultyGuide}
- Mix question types: MCQ (multiple choice), short_answer, and long_answer
- For hard questions: maximize depth and complexity within the syllabus, don't make them trivial
- If the topic involves mathematics, physics, chemistry, or any STEM subject, include equations using LaTeX notation
- If a question refers to a diagram, describe the diagram clearly in diagramDescription
- Quality over quantity — each question must be meaningful and educational

CRITICAL JSON FORMATTING — YOU MUST FOLLOW THIS:
- Your response must be RAW JSON only — no markdown, no code fences, no explanation text before or after
- In JSON strings, ALL LaTeX backslashes MUST be doubled: write \\\\frac not \\frac, write \\\\sin not \\sin, write \\\\theta not \\theta
- Example of CORRECT LaTeX in JSON: "$$\\\\frac{d}{dx}[x^n] = nx^{n-1}$$"
- Example of WRONG LaTeX in JSON: "$\\frac{d}{dx}[x^n] = nx^{n-1}$"
- Never use single backslash before any letter in a JSON string value

Respond ONLY with a valid JSON object in this exact format:
{
  "questions": [
    {
      "id": 1,
      "question": "question text here",
      "type": "mcq" | "short_answer" | "long_answer",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"] (only for mcq, null otherwise),
      "correctAnswer": "the correct answer or option letter",
      "explanation": "detailed explanation of why this is correct",
      "hasDiagram": true | false,
      "diagramDescription": "description of diagram if hasDiagram is true, null otherwise",
      "hasEquation": true | false,
      "equations": ["$latex_equation_1$", "$latex_equation_2$"] (array of LaTeX equations if hasEquation is true, null otherwise),
      "difficulty": "${difficulty}"
    }
  ]
}`;
}

router.post("/quiz/generate", async (req, res): Promise<void> => {
  const parsed = GenerateQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const settingsRows = await db.select().from(settingsTable).limit(1);
  if (settingsRows.length === 0 || !settingsRows[0].apiKey) {
    res.status(400).json({ error: "No API key configured. Please add your AI API key in Settings." });
    return;
  }
  const settings = settingsRows[0];

  const topicRows = await db
    .select({
      topicId: topicsTable.id,
      topicName: topicsTable.name,
      chapterName: chaptersTable.name,
      subjectName: subjectsTable.name,
      standardName: standardsTable.name,
      boardName: boardsTable.name,
    })
    .from(topicsTable)
    .innerJoin(chaptersTable, eq(topicsTable.chapterId, chaptersTable.id))
    .innerJoin(subjectsTable, eq(chaptersTable.subjectId, subjectsTable.id))
    .innerJoin(standardsTable, eq(subjectsTable.standardId, standardsTable.id))
    .innerJoin(boardsTable, eq(standardsTable.boardId, boardsTable.id))
    .where(eq(topicsTable.id, parsed.data.topicId));

  if (topicRows.length === 0) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }
  const ctx = topicRows[0];

  const prompt = buildPrompt(
    ctx.topicName,
    ctx.chapterName,
    ctx.subjectName,
    ctx.standardName,
    ctx.boardName,
    parsed.data.questionCount,
    parsed.data.difficulty,
  );

  let rawText: string;
  try {
    rawText = await callAI(settings.apiKey!, settings.provider, settings.model, prompt);
  } catch (err) {
    req.log.error({ err }, "AI API call failed");
    res.status(502).json({ error: `AI generation failed: ${(err as Error).message}` });
    return;
  }

  let questions: unknown[];
  try {
    questions = parseAIQuestions(rawText);
  } catch (err) {
    logger.error({ err, rawText }, "Failed to parse AI response as JSON");
    res.status(502).json({ error: "AI returned invalid JSON. Try again." });
    return;
  }

  const [session] = await db.insert(quizSessionsTable).values({
    topicId: ctx.topicId,
    topicName: ctx.topicName,
    chapterName: ctx.chapterName,
    subjectName: ctx.subjectName,
    standardName: ctx.standardName,
    boardName: ctx.boardName,
    questionCount: questions.length,
    difficulty: parsed.data.difficulty,
    questions,
  }).returning();

  res.json(GenerateQuizResponse.parse({
    ...session,
    questions: session.questions as unknown[],
    createdAt: session.createdAt.toISOString(),
  }));
});

router.get("/quiz/history", async (_req, res): Promise<void> => {
  const sessions = await db
    .select()
    .from(quizSessionsTable)
    .orderBy(quizSessionsTable.createdAt);

  res.json(ListQuizHistoryResponse.parse(
    sessions.map(s => ({
      ...s,
      questions: s.questions as unknown[],
      createdAt: s.createdAt.toISOString(),
    }))
  ));
});

export default router;
