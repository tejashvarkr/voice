
// import express from 'express';
// import cors from 'cors';
// import { GoogleGenAI, Type } from '@google/genai';



// const app = express();
// const PORT = 3000;

// // Security Key (Must match the one provided in Bruno headers)
// const VOXGUARD_SECRET_KEY = "sk_voxguard_secure_key_2025";

// // Middleware
// app.use(cors());
// app.use(express.json({ limit: '50mb' }));

// /**
//  * POST /api/voice-detection
//  * Body: { "language": "Tamil", "audioFormat": "mp3", "audioBase64": "..." }
//  * Header: x-api-key: sk_voxguard_secure_key_2025
//  */
// app.post('/api/voice-detection', async (req:any, res:any) => {
//   const apiKey = req.headers['x-api-key'];
//   const { language, audioFormat, audioBase64 } = req.body;

//   console.log(`[LOG] Forensic scan request received for: ${language || 'Auto-detect'}`);

//   // 1. Mandatory Header Validation
//   if (apiKey !== VOXGUARD_SECRET_KEY) {
//     console.warn(`[WARN] Unauthorized access attempt detected.`);
//     return res.status(401).json({
//       "status": "error",
//       "message": "Invalid API key or malformed request"
//     });
//   }

//   // 2. Input Validation
//   if (!audioBase64) {
//     return res.status(400).json({
//       "status": "error",
//       "message": "Missing audioBase64 field"
//     });
//   }

//   try {
//     // Initialize the Gemini SDK using server-side env variable
//     const ai = new GoogleGenAI({ apiKey: 'AIzaSyCumpe0vzMkS_FoVHPri1M1UMPlmqD6RLg' });
    
//     // Execute forensic sweep using Gemini 3 Pro
//     const response = await ai.models.generateContent({
//       model: 'gemini-3-flash-preview',
//       contents: {
//         parts: [
//           {
//             inlineData: {
//               data: audioBase64,
//               mimeType: audioFormat === 'wav' ? 'audio/wav' : 'audio/mp3'
//             }
//           },
//           {
//             text: `Act as a specialized forensic audio engineer. Analyze this ${language || ''} recording.
//                    Determine if the voice is HUMAN or AI_GENERATED.
//                    Search for synthetic artifacts, jitter patterns, and lack of natural micro-breaths.
//                    Respond only in valid JSON.`
//           }
//         ]
//       },
//       config: {
//         responseMimeType: "application/json",
//         responseSchema: {
//           type: Type.OBJECT,
//           properties: {
//             classification: { 
//               type: Type.STRING, 
//               description: "Classification: 'AI_GENERATED' or 'HUMAN'" 
//             },
//             confidenceScore: { 
//               type: Type.NUMBER, 
//               description: "Forensic confidence (0.0 - 1.0)" 
//             },
//             language: { 
//               type: Type.STRING, 
//               description: "The detected language of the clip" 
//             },
//             explanation: { 
//               type: Type.STRING, 
//               description: "Reasoning for the forensic conclusion" 
//             }
//           },
//           required: ["classification", "confidenceScore", "language", "explanation"]
//         }
//       }
//     });

//     // Parse engine result
//     const result = JSON.parse(response.text || '{}');
    
//     // 3. Return structured JSON response
//     res.json({
//       "status": "success",
//       "language": result.language,
//       "classification": result.classification,
//       "confidenceScore": result.confidenceScore,
//       "explanation": result.explanation
//     });

//   } catch (error: any) {
//     console.error('[CRITICAL] Forensic Engine Failure:', error);
//     res.status(500).json({
//       "status": "error",
//       "message": "Internal forensic engine processing failure",
//       "details": error.message
//     });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`
//   --------------------------------------------------
//   🛡️  VoxGuard Backend API Active
//   --------------------------------------------------
//   Port:     ${PORT}
//   Endpoint: http://localhost:${PORT}/api/voice-detection
//   Header:   x-api-key: ${VOXGUARD_SECRET_KEY}
//   --------------------------------------------------
//   `);
// });

import express from "express";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();

// ✅ MUST use Render-provided PORT
const PORT = process.env.PORT || 3000;

// ✅ Secrets from environment variables
const VOXGUARD_SECRET_KEY = "sk_voxguard_secure_key_2025";
const GEMINI_API_KEY = "AIzaSyCumpe0vzMkS_FoVHPri1M1UMPlmqD6RLg" ;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

/**
 * POST /api/voice-detection
 * Header: x-api-key
 */
app.post("/api/voice-detection", async (req:any, res:any) => {
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
    const ai = new GoogleGenAI({ apiKey: 'AIzaSyCumpe0vzMkS_FoVHPri1M1UMPlmqD6RLg' });

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

app.get("/health", (_:any, res:any) => {
  res.status(200).json({ status: "OK" });
});

app.listen(PORT, () => {
  console.log(`VoxGuard API running on port ${PORT}`);
});

