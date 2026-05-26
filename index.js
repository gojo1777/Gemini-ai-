import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

/* ✅ API KEYS */
const GEMINI_API_KEY = "AIzaSyBOkwv4A4n4cWoxh8hoVc5PLU7UwnT81Ws";
const OPENROUTER_API_KEY = "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"; // openrouter.ai - free!

/* ✅ ROOT */
app.get("/", (req, res) => {
  res.json({ status: true, message: "🚀 Sayura AI Running" });
});

/* ✅ AI */
app.get("/ai", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ status: false, error: "Query missing" });

    const systemPrompt = `ඔබ Sayura AI නමැති Sinhala AI assistant කෙනෙකි.
Rules:
- හැම reply එකක්ම Sinhala වලින් දෙන්න.
- English භාවිතා කරන්න එපා.
- Unicode සිංහල භාවිතා කරන්න.
- Friendly style එකෙන් කතා කරන්න.
- illegal, hacking, spam content දෙන්න එපා.`;

    let geminiError, openrouterError;

    /* ✅ GEMINI - fixed model name */
    try {
      const gemini = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${q}` }] }]
        }
      );

      const reply = gemini.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        console.log("✅ Gemini worked!");
        return res.json({ status: true, provider: "Gemini", result: reply });
      }
    } catch (e) {
      geminiError = e.response?.data || e.message;
      console.log("❌ Gemini failed:", geminiError);
    }

    /* ✅ OPENROUTER BACKUP - free models තියෙනවා */
    try {
      const openrouter = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3.1-8b-instruct:free", // free model
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: q }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://sayura-ai.com",
            "X-Title": "Sayura AI"
          }
        }
      );

      const reply = openrouter.data?.choices?.[0]?.message?.content;
      if (reply) {
        console.log("✅ OpenRouter worked!");
        return res.json({ status: true, provider: "OpenRouter", result: reply });
      }
    } catch (e) {
      openrouterError = e.response?.data || e.message;
      console.log("❌ OpenRouter failed:", openrouterError);
    }

    /* ❌ ALL FAILED */
    return res.status(500).json({
      status: false,
      error: "All AI servers failed",
      debug: { gemini: geminiError, openrouter: openrouterError }
    });

  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
});

export default app;
