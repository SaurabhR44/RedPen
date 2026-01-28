const express = require("express");
const Groq = require("groq-sdk");

const unifiedRouter = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert writing assistant. Analyze the user's text and provide:

1. CORRECTNESS: Fix all spelling, grammar, and punctuation errors.
2. CLARITY: Flag unclear or ambiguous phrases; suggest clearer alternatives.
3. CONCISENESS: Suggest shortening wordy phrases without losing meaning.
4. ENGAGEMENT: Suggest more precise or impactful word choices where the writing feels flat or vague.
5. TONE: Note if tone is inconsistent (e.g. mixing formal and casual) and suggest adjustments.
6. STRUCTURE: Flag run-on sentences, fragments, or awkward sentence structure.

Output ONLY valid JSON with no other text. Use this exact shape:

{
  "correctedText": "the full corrected text with all fixes applied (spelling, grammar, punctuation). For clarity/conciseness/engagement/tone/structure, apply the fix only when it's a clear improvement; otherwise keep the original and list it in suggestions.",
  "suggestions": [
    {
      "original": "exact phrase or word from the text",
      "suggestion": "your recommended replacement or rewritten phrase",
      "message": "brief explanation for the user",
      "category": "spelling | grammar | punctuation | clarity | conciseness | engagement | tone | word_choice | structure"
    }
  ],
  "insights": {
    "wordCount": number,
    "sentenceCount": number,
    "detectedTone": "formal | casual | neutral | professional | friendly (one or two words)",
    "readabilityNote": "one short sentence about readability (e.g. 'Clear and direct' or 'Consider shorter sentences')"
  }
}

Rules:
- category must be exactly one of: spelling, grammar, punctuation, clarity, conciseness, engagement, tone, word_choice, structure.
- Include every correction and improvement you recommend in suggestions (with category), and apply correctness fixes in correctedText.
- For clarity, conciseness, engagement, tone, word_choice, structure: add to suggestions; optionally apply in correctedText if it's clearly better.
- insights.wordCount and insights.sentenceCount must be integers for the ORIGINAL text.
- If no issues, return same text in correctedText, empty suggestions [], and still include insights.
- Preserve paragraphs and line breaks in correctedText.`;

function parseGroqJson(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const str = jsonMatch ? jsonMatch[0] : trimmed;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

const VALID_CATEGORIES = new Set([
  "spelling", "grammar", "punctuation", "clarity", "conciseness",
  "engagement", "tone", "word_choice", "structure",
]);

function normalizeCategory(cat) {
  if (typeof cat !== "string") return "grammar";
  const c = cat.toLowerCase().trim();
  return VALID_CATEGORIES.has(c) ? c : "grammar";
}

unifiedRouter.post("/", async (req, res) => {
  const { text } = req.body;

  try {
    if (!text || text.trim().length === 0) {
      return res.json({
        correctedText: text || "",
        suggestions: [],
        hasSuggestions: false,
        totalIssues: 0,
        insights: { wordCount: 0, sentenceCount: 0, detectedTone: "", readabilityNote: "" },
      });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set");
      return res.status(500).json({
        error: "Writing check is not configured. Set GROQ_API_KEY in .env",
        correctedText: text,
        suggestions: [],
        hasSuggestions: false,
        insights: null,
      });
    }

    console.log("🤖 Full writing check with Groq...");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze and improve the following text. Apply all correctness fixes and add suggestions for clarity, conciseness, engagement, tone, and structure. Reply with only the JSON object.\n\n${text}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 8192,
      response_format: { type: "json_object" },
    });

    const rawContent = completion?.choices?.[0]?.message?.content ?? "";
    const parsed = parseGroqJson(rawContent);

    let correctedText = text;
    let suggestions = [];
    let insights = {
      wordCount: 0,
      sentenceCount: 0,
      detectedTone: "",
      readabilityNote: "",
    };

    if (parsed && typeof parsed === "object") {
      if (typeof parsed.correctedText === "string" && parsed.correctedText.length > 0) {
        correctedText = parsed.correctedText;
      }
      if (Array.isArray(parsed.suggestions)) {
        suggestions = parsed.suggestions
          .filter(
            (s) =>
              s && typeof s.original === "string" && typeof s.suggestion === "string"
          )
          .map((s) => ({
            original: String(s.original),
            suggestion: String(s.suggestion),
            message: typeof s.message === "string" ? s.message : "Suggestion",
            category: normalizeCategory(s.category),
          }));
      }
      if (parsed.insights && typeof parsed.insights === "object") {
        const i = parsed.insights;
        insights = {
          wordCount: typeof i.wordCount === "number" ? Math.max(0, Math.floor(i.wordCount)) : (text.split(/\s+/).filter(Boolean).length),
          sentenceCount: typeof i.sentenceCount === "number" ? Math.max(0, Math.floor(i.sentenceCount)) : (text.split(/[.!?]+/).filter(Boolean).length),
          detectedTone: typeof i.detectedTone === "string" ? i.detectedTone.trim() : "",
          readabilityNote: typeof i.readabilityNote === "string" ? i.readabilityNote.trim() : "",
        };
      }
    }

    if (insights.wordCount === 0) {
      insights.wordCount = text.split(/\s+/).filter(Boolean).length;
    }
    if (insights.sentenceCount === 0) {
      insights.sentenceCount = text.replace(/\s+/g, " ").split(/[.!?]+/).filter(Boolean).length;
    }

    console.log("✓ Writing check complete");

    res.json({
      correctedText,
      suggestions,
      hasSuggestions: suggestions.length > 0,
      totalIssues: suggestions.length,
      insights,
    });
  } catch (error) {
    console.error("❌ Groq writing check error:", error.message);
    res.status(500).json({
      error: "Writing check failed. Please try again.",
      correctedText: text || "",
      suggestions: [],
      hasSuggestions: false,
      insights: null,
    });
  }
});

module.exports = unifiedRouter;
