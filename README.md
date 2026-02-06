# 🖋️ RedPen - AI Writing Assistant

RedPen is a lightweight, high-performance AI writing assistant designed to elevate your writing. It provides real-time grammar correction, clarity enhancements, tone analysis, and intelligent paraphrasing—all powered by **GroqCloud's Llama 3** models for near-instant responses.

![RedPen UI](https://red-pen.vercel.app/assets/ai-BhjJpRJ-.png)

## ✨ Features

- **Grammar & Spell Check**: Instant detection and correction of errors.
- **Intelligent Paraphrasing**: Rewrite entire paragraphs while maintaining meaning.
- **Selection Tools**: Select any text to simplify, expand, or find synonyms.
- **Readability Insights**: Real-time Flesch Reading Ease scores and tone detection.
- **No Login Required**: Start writing immediately without the friction of authentication.
- **Privacy First**: No database, no tracking—just you and the AI.

## 🚀 Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion.
- **Backend**: Node.js, Express.
- **AI**: Groq SDK (Llama 3.3 70B).
- **Deployment**: Optimized for Vercel.

## 🛠️ Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/SaurabhR44/RedPen.git
   cd RedPen
   ```

2. **Install dependencies**:
   ```bash
   npm run install-all
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `server` directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   PORT=8000
   ```

4. **Run the application**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## 🌐 Deployment (Vercel)

This project is pre-configured for Vercel with zero-config API routing.

1. Push your code to GitHub.
2. Import the project into Vercel.
3. Add `GROQ_API_KEY` to the **Environment Variables** in Vercel Settings.
4. Deploy!

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ for better writing.
