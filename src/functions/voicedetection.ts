import express, { Request, Response } from "express";
import cors from "cors";
import serverless from "serverless-http";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Secrets from environment variables
const VOXGUARD_SECRET_KEY = 'sk_voxguard_secure_key_2025';
const GEMINI_API_KEY = "AIzaSyCumpe0vzMkS_FoVHPri1M1UMPlmqD6RLg";

/**
 * POST /.netlify/functions/voiceDetection
 * Header: x-api-key
 */
app.post("/", async (req: Request, res: Response) => {
  const apiKey = req.headers["x-api-key"];
  const { language, audioFormat, audioBase64 } = req.body;

  if (apiKey !== VOXGUARD_SECRET_KEY) {
    return res.status(401).json({
      status: "error",
      message: "Invalid API key"
    });
  }

  if (!audioBase64) {
    return res.status(400).json({
      status: "error",
      message: "audioBase64 is required"
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: 'AIzaSyCumpe0vzMkS_FoVHPri1M1UMPlmqD6RLg'  });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: audioBase64,
              mimeType: audioFormat === "wav" ? "audio/wav" : "audio/mp3"
            }
          },
          {
            text: `Analyze this ${language || ""} audio and classify as HUMAN or AI_GENERATED.
Respond strictly in JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            language: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["classification", "confidenceScore", "language", "explanation"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");

    res.json({
      status: "success",
      ...result
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
});

/**
 * Health check
 */
app.get("/health", (_, res: Response) => {
  res.status(200).json({ status: "OK" });
});

// ✅ Export handler for Netlify
export const handler = serverless(app);
