const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

function parseJson(raw) {
  if (!raw || typeof raw !== "string") return null;
  const m = raw.trim().match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  try {
    return JSON.parse(m ? m[0] : raw);
  } catch {
    return null;
  }
}

const MAX_PARAPHRASE_LENGTH = 2500;

// Full-text paraphrasing: return 2–3 alternative versions
router.post("/paraphrase", async (req, res) => {
  let { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.json({ original: "", options: [], error: null });
  }
  text = text.trim();
  if (!text) {
    return res.json({ original: "", options: [], error: null });
  }
  if (!groq) {
    return res.status(500).json({
      error: "Server is not configured for paraphrasing.",
      original: text,
      options: [],
    });
  }
  const truncated = text.length > MAX_PARAPHRASE_LENGTH
    ? text.slice(0, MAX_PARAPHRASE_LENGTH) + "..."
    : text;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You paraphrase text so it keeps the exact same meaning but uses different words and structure. Output ONLY valid JSON: { "options": ["paraphrase 1", "paraphrase 2", "paraphrase 3"] }. Give 2 to 3 different paraphrases. No other text.`,
        },
        {
          role: "user",
          content: `Paraphrase the following text in 2–3 different ways. Same meaning, different wording. Reply with only the JSON object.\n\n${truncated}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });
    const raw = completion?.choices?.[0]?.message?.content ?? "{}";
    const parsed = parseJson(raw);
    const options = Array.isArray(parsed?.options)
      ? parsed.options.filter((s) => typeof s === "string" && s.length > 0).slice(0, 3)
      : [];
    res.json({
      original: text,
      options: options.length ? options : [text],
      error: null,
    });
  } catch (e) {
    console.error("Paraphrase error:", e.message);
    res.status(200).json({
      error: e.message || "Paraphrasing failed. Try shorter text or again later.",
      original: text,
      options: [text],
    });
  }
});

// Improve selected text (clearer, more professional, etc.)
router.post("/improve", async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.json({ original: "", improved: "", alternatives: [] });
  }
  if (!groq) {
    return res.status(500).json({ error: "GROQ_API_KEY not set", improved: text, alternatives: [] });
  }
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You improve the user's text: fix grammar, choose stronger words, and make it clearer. Output ONLY valid JSON: { "improved": "single best improved version", "alternatives": ["version 2", "version 3"] }. Give one main improved version and 0–2 alternatives. No other text.`,
        },
        {
          role: "user",
          content: `Improve this text. Reply with only the JSON object.\n\n${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });
    const raw = completion?.choices?.[0]?.message?.content ?? "{}";
    const parsed = parseJson(raw);
    const improved = typeof parsed?.improved === "string" ? parsed.improved.trim() : text;
    const alternatives = Array.isArray(parsed?.alternatives)
      ? parsed.alternatives.filter((s) => typeof s === "string" && s.length > 0).slice(0, 2)
      : [];
    res.json({ original: text, improved, alternatives });
  } catch (e) {
    console.error("Improve error:", e.message);
    res.status(500).json({ error: e.message, original: text, improved: text, alternatives: [] });
  }
});

// Synonyms for a single word or short phrase
router.post("/synonyms", async (req, res) => {
  const { word } = req.body;
  const w = (word ?? "").trim();
  if (!w) {
    return res.json({ word: "", synonyms: [] });
  }
  if (!groq) {
    return res.status(500).json({ error: "GROQ_API_KEY not set", word: w, synonyms: [] });
  }
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You suggest synonyms or alternative words/phrases. Output ONLY valid JSON: { "synonyms": ["word1", "word2", ...] }. Give 5–10 alternatives. Same part of speech and similar register. No other text.`,
        },
        {
          role: "user",
          content: `Suggest synonyms or alternatives for: "${w}". Reply with only the JSON object.`,
        },
      ],
      temperature: 0.4,
      max_tokens: 256,
      response_format: { type: "json_object" },
    });
    const raw = completion?.choices?.[0]?.message?.content ?? "{}";
    const parsed = parseJson(raw);
    const synonyms = Array.isArray(parsed?.synonyms)
      ? parsed.synonyms.filter((s) => typeof s === "string" && s.trim().length > 0).slice(0, 10)
      : [];
    res.json({ word: w, synonyms });
  } catch (e) {
    console.error("Synonyms error:", e.message);
    res.status(500).json({ error: e.message, word: w, synonyms: [] });
  }
});

// Simplify or expand (optional)
router.post("/rewrite", async (req, res) => {
  const { text, mode } = req.body;
  const t = (text ?? "").trim();
  if (!t) return res.json({ text: "", result: "" });
  if (!groq) return res.status(500).json({ error: "GROQ_API_KEY not set", result: t });
  const isSimplify = (mode ?? "simplify").toString().toLowerCase() === "simplify";
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: isSimplify
            ? "Rewrite the user's text in simpler, shorter words. Keep the same meaning. Output only the rewritten text, nothing else."
            : "Expand the user's text with a bit more detail or explanation. Keep the same tone. Output only the expanded text, nothing else.",
        },
        { role: "user", content: t },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });
    const result = (completion?.choices?.[0]?.message?.content ?? t).trim();
    res.json({ text: t, result: result || t });
  } catch (e) {
    console.error("Rewrite error:", e.message);
    res.status(500).json({ error: e.message, text: t, result: t });
  }
});

module.exports = router;
