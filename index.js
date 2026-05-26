import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

/* ✅ API KEYS - EMBEDDED */
const GEMINI_API_KEY = "AIzaSyBOkwv4A4n4cWoxh8hoVc5PLU7UwnT81Ws;
const DEEPSEEK_API_KEY = "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";

/* ✅ ROOT */
app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "🚀 Sayura AI Running"
  });
});

/* ✅ AI */
app.get("/ai", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) {
      return res.status(400).json({
        status: false,
        error: "Query missing"
      });
    }

    const systemPrompt = `
ඔබ Sayura AI නමැති Sinhala AI assistant කෙනෙකි.
Rules:
- හැම reply එකක්ම Sinhala වලින් දෙන්න.
- English භාවිතා කරන්න එපා.
- Unicode සිංහල භාවිතා කරන්න.
- Friendly style එකෙන් කතා කරන්න.
- illegal, hacking, spam content දෙන්න එපා.
`;

    let geminiError, deepseekError;

    /* ✅ GEMINI */
    try {
      const gemini = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nUser: ${q}`
                }
              ]
            }
          ]
        }
      );

      const reply = gemini.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        console.log("✅ Gemini worked!");
        return res.json({
          status: true,
          provider: "Gemini",
          result: reply
        });
      }
    } catch (e) {
      geminiError = e.response?.data || e.message;
      console.log("❌ Gemini failed:", geminiError);
    }

    /* ✅ DEEPSEEK BACKUP */
    try {
      const deepseek = await axios.post(
        "https://api.deepseek.com/chat/completions",
        {
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: q }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const reply = deepseek.data?.choices?.[0]?.message?.content;
      if (reply) {
        console.log("✅ DeepSeek worked!");
        return res.json({
          status: true,
          provider: "DeepSeek",
          result: reply
        });
      }
    } catch (e) {
      deepseekError = e.response?.data || e.message;
      console.log("❌ DeepSeek failed:", deepseekError);
    }

    /* ❌ ALL FAILED */
    return res.status(500).json({
      status: false,
      error: "All AI servers failed",
      debug: { gemini: geminiError, deepseek: deepseekError }
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      error: err.message
    });
  }
});

export default app;
