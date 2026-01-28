const express = require("express");
const analyzeRouter = express.Router();

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = "https://api-inference.huggingface.co/models";

console.log("✓ HuggingFace AI Rephrase initialized");

// Query HuggingFace API with retry
async function queryHuggingFace(model, payload, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${HF_API_URL}/${model}`, {
        headers: { Authorization: `Bearer ${HF_API_KEY}` },
        method: "POST",
        body: JSON.stringify(payload),
        timeout: 30000,
      });

      if (response.status === 503 && attempt < retries) {
        console.log(`⏳ Model loading... (attempt ${attempt}/${retries})`);
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (e) {
      if (attempt === retries) throw e;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

// AI-Powered Rephrase/Alternative suggestions
analyzeRouter.post("/rephrase", async (req, res) => {
  const { sentence } = req.body;

  try {
    if (!sentence || sentence.trim().length === 0) {
      return res.json({
        original: sentence || "",
        alternatives: [sentence],
      });
    }

    console.log("🤖 Generating alternatives with HuggingFace AI...");

    // Use a paraphrase model
    let alternatives = [sentence];
    try {
      const results = await queryHuggingFace(
        "tuner007/pegasus_paraphrase",
        {
          inputs: sentence,
          parameters: { num_beams: 5, num_return_sequences: 3 },
        }
      );

      if (Array.isArray(results) && results.length > 0) {
        // Extract generated text from results
        alternatives = results
          .map((r) => r.generated_text || r.summary_text || sentence)
          .filter((text) => text && text.length > 0)
          .slice(0, 3);

        if (alternatives.length === 0) {
          alternatives = [sentence];
        }
      }
      console.log("✓ Alternatives generated");
    } catch (e) {
      console.log("⚠️ Using original sentence as fallback");
      alternatives = [sentence];
    }

    res.json({
      original: sentence,
      alternatives,
    });
  } catch (error) {
    console.error("❌ Rephrase error:", error.message);
    res.json({
      original: sentence,
      alternatives: [sentence],
    });
  }
});

// Default analyze endpoint
analyzeRouter.post("/", async (req, res) => {
  const { sentence } = req.body;

  try {
    if (!sentence || sentence.trim().length === 0) {
      return res.json({
        rephrasedSentences: [],
      });
    }

    console.log("🤖 Analyzing text with HuggingFace AI...");

    let rephrasedSentences = [];
    try {
      const results = await queryHuggingFace(
        "tuner007/pegasus_paraphrase",
        {
          inputs: sentence,
          parameters: { num_beams: 5, num_return_sequences: 3 },
        }
      );

      if (Array.isArray(results) && results.length > 0) {
        rephrasedSentences = results
          .map((r) => r.generated_text || r.summary_text || sentence)
          .filter((text) => text && text.length > 0)
          .slice(0, 3);
      }
      console.log("✓ Analysis complete");
    } catch (e) {
      console.log("⚠️ Using original text");
      rephrasedSentences = [sentence];
    }

    res.json({
      rephrasedSentences: rephrasedSentences.length > 0 ? rephrasedSentences : [sentence],
    });
  } catch (error) {
    console.error("❌ Analysis error:", error.message);
    res.json({
      rephrasedSentences: [sentence],
    });
  }
});

module.exports = analyzeRouter;
