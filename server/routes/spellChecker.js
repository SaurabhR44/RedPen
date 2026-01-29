const express = require("express");
const spellChecker = express.Router();
const axios = require("axios");

spellChecker.post("/", async (req, res) => {
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

    // Filter for spell checking errors
    const spellErrors = matches.filter((match) => {
      const isSpellingError =
        match.rule &&
        (match.rule.issueType === "misspelling" ||
          match.rule.category === "TYPOS" ||
          match.rule.id === "MORFOLOGIK_RULE_EN_US" ||
          match.rule.id?.includes("SPELL") ||
          match.rule.id?.includes("TYPO"));
      return isSpellingError || false;
    });

    // If no explicit spell errors, look for all errors to catch misspellings
    const errorsToProcess = spellErrors.length > 0 ? spellErrors : matches;

    // Sort by offset in reverse
    const sortedErrors = errorsToProcess.sort((a, b) => b.offset - a.offset);

    sortedErrors.forEach((match) => {
      if (match.replacements && match.replacements.length > 0) {
        const suggestion = match.replacements[0].value;
        const originalWord = text.substring(match.offset, match.offset + match.length);

        errors.push({
          offset: match.offset,
          length: match.length,
          original: originalWord,
          suggestion: suggestion,
          message: match.message || "Spelling error",
          rule: match.rule?.id || "SPELLING",
        });

        // Apply correction
        correctedText =
          correctedText.substring(0, match.offset) +
          suggestion +
          correctedText.substring(match.offset + match.length);
      }
    });

    res.json({ correctedText, errors });
  } catch (error) {
    console.error("Error checking spelling:", error.message);
    res.status(500).json({ 
      error: "Error checking spelling",
      correctedText: text,
      errors: []
    });
  }
});

module.exports = spellChecker;
