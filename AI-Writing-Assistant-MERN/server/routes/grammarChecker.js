const express = require("express");
const grammarCheck = express.Router();
const axios = require("axios");

grammarCheck.post("/", async (req, res) => {
  const { text } = req.body;
  try {
    if (!text || text.trim().length === 0) {
      return res.json({ correctedText: text, errors: [] });
    }

    const response = await axios.post(
      "https://api.languagetool.org/v2/check",
      new URLSearchParams({
        text: text,
        language: "en-US",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    let correctedText = text;
    const errors = [];
    const matches = response.data.matches || [];

    // Sort by offset in reverse to avoid index shifting
    const sortedMatches = matches.sort((a, b) => b.offset - a.offset);

    sortedMatches.forEach((match) => {
      const errorMsg = match.message || "Grammar issue";
      
      if (match.replacements && match.replacements.length > 0) {
        const suggestion = match.replacements[0].value;
        const originalWord = text.substring(match.offset, match.offset + match.length);
        
        errors.push({
          offset: match.offset,
          length: match.length,
          original: originalWord,
          suggestion: suggestion,
          message: errorMsg,
          rule: match.rule?.id || "GRAMMAR",
        });

        // Apply the first (best) suggestion
        correctedText =
          correctedText.substring(0, match.offset) +
          suggestion +
          correctedText.substring(match.offset + match.length);
      }
    });

    res.json({ correctedText, errors });
  } catch (error) {
    console.error("Error checking grammar:", error.message);
    res.status(500).json({ 
      error: "Error checking grammar",
      correctedText: text,
      errors: []
    });
  }
});

module.exports = grammarCheck;
