import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "🚀 Sayura AI Running"
  });
});

app.get("/ai", async (req, res) => {

  const q = req.query.q;

  if (!q) {
    return res.json({
      status: false,
      error: "Query missing"
    });
  }

  /* ✅ GEMINI */
  try {

    const gemini = await axios.post(

      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,

      {
        contents: [
          {
            parts: [
              {
                text: q
              }
            ]
          }
        ]
      }

    );

    const reply =
      gemini.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply) {

      return res.json({
        status: true,
        provider: "Gemini",
        result: reply
      });
    }

  } catch (e) {

    console.log(
      "❌ GEMINI:",
      e.response?.data || e.message
    );
  }

  /* ✅ DEEPSEEK */
  try {

    const deepseek = await axios.post(

      "https://api.deepseek.com/chat/completions",

      {
        model: "deepseek-chat",

        messages: [
          {
            role: "user",
            content: q
          }
        ]
      },

      {
        headers: {
          Authorization:
            `Bearer ${process.env.DEEPSEEK_API_KEY}`,

          "Content-Type": "application/json"
        }
      }
    );

    const reply =
      deepseek.data?.choices?.[0]?.message?.content;

    if (reply) {

      return res.json({
        status: true,
        provider: "DeepSeek",
        result: reply
      });
    }

  } catch (e) {

    console.log(
      "❌ DEEPSEEK:",
      e.response?.data || e.message
    );
  }

  /* ✅ OPENROUTER */
  try {

    const openrouter = await axios.post(

      "https://openrouter.ai/api/v1/chat/completions",

      {
        model:
          "deepseek/deepseek-chat-v3-0324:free",

        messages: [
          {
            role: "user",
            content: q
          }
        ]
      },

      {
        headers: {
          Authorization:
            `Bearer ${process.env.OPENROUTER_API_KEY}`,

          "Content-Type": "application/json"
        }
      }
    );

    const reply =
      openrouter.data?.choices?.[0]?.message?.content;

    if (reply) {

      return res.json({
        status: true,
        provider: "OpenRouter",
        result: reply
      });
    }

  } catch (e) {

    console.log(
      "❌ OPENROUTER:",
      e.response?.data || e.message
    );
  }

  return res.json({
    status: false,
    error: "All AI servers failed"
  });

});

export default app;
