const express = require("express");
const cors = require("cors");
require("dotenv").config();
const analyzeRouter = require("./routes/analyze");
const grammarCheck = require("./routes/grammarChecker");
const spellChecker = require("./routes/spellChecker");
const unifiedRouter = require("./routes/unified");
const writingTools = require("./routes/writingTools");

const app = express();
const port = process.env.PORT || 8000;


app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, name: "RedPen" }));

app.use("/api/analyze", analyzeRouter);
app.use("/api/grammarcheck", grammarCheck);
app.use("/api/spellcheck", spellChecker);
app.use("/api/check", unifiedRouter);
app.use("/api/tools", writingTools);

app.listen(port, () => {
  console.log(`RedPen API listening at http://localhost:${port}`);
});

module.exports = app;
