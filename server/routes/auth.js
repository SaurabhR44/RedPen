const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { getDb } = require("../db");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "7d";
const OAUTH_PASSWORD_PLACEHOLDER = "oauth:google";

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

router.post("/register", (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const emailTrim = String(email).trim().toLowerCase();
  if (!validateEmail(emailTrim)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const db = getDb();
  try {
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(emailTrim);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const password_hash = bcrypt.hashSync(password, SALT_ROUNDS);
    const nameVal = name ? String(name).trim().slice(0, 100) : null;

    const result = db.prepare(
      "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)"
    ).run(emailTrim, password_hash, nameVal);

    const token = jwt.sign(
      { userId: result.lastInsertRowid, email: emailTrim },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.status(201).json({
      message: "Account created",
      user: { id: result.lastInsertRowid, email: emailTrim, name: nameVal },
      token,
      expiresIn: TOKEN_EXPIRY,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const emailTrim = String(email).trim().toLowerCase();
  const db = getDb();

  try {
    const user = db.prepare(
      "SELECT id, email, password_hash, name FROM users WHERE email = ?"
    ).get(emailTrim);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.password_hash === OAUTH_PASSWORD_PLACEHOLDER) {
      return res.status(401).json({ error: "This account uses Google sign-in. Use the Google button to log in." });
    }

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({
      message: "Logged in",
      user: { id: user.id, email: user.email, name: user.name },
      token,
      expiresIn: TOKEN_EXPIRY,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/google", async (req, res) => {
  const { id_token } = req.body;
  if (!id_token || !googleClient) {
    return res.status(400).json({
      error: process.env.GOOGLE_CLIENT_ID ? "Google token is required" : "Google sign-in is not configured",
    });
  }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = (payload.email || "").trim().toLowerCase();
    const name = payload.name || payload.given_name || null;
    if (!email) {
      return res.status(400).json({ error: "Google account has no email" });
    }
    const db = getDb();
    let user = db.prepare(
      "SELECT id, email, name FROM users WHERE email = ?"
    ).get(email);
    if (!user) {
      const result = db.prepare(
        "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)"
      ).run(email, OAUTH_PASSWORD_PLACEHOLDER, name);
      user = {
        id: result.lastInsertRowid,
        email,
        name,
      };
    } else {
      if (user.name !== name && name) {
        db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, user.id);
        user.name = name;
      }
      user = { id: user.id, email: user.email, name: user.name };
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    res.json({
      message: "Logged in",
      user: { id: user.id, email: user.email, name: user.name },
      token,
      expiresIn: TOKEN_EXPIRY,
    });
  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(401).json({ error: "Invalid Google sign-in" });
  }
});

router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = db.prepare(
      "SELECT id, email, name, created_at FROM users WHERE id = ?"
    ).get(payload.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
