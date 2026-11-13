
// const { GoogleGenAI } = require("@google/genai");

// if (!process.env.GEMINI_API_KEY) {
//   throw new Error("GEMINI_API_KEY is missing from backend/.env");
// }

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// async function generateCallAssistance({
//   stageName,
//   stagePurpose,
//   prospectWords,
//   conversationContext,
// }) {
//   const prompt = `
// You are CallPilot, an expert B2B cold-calling assistant.

// Help the caller handle the current conversation naturally.

// CURRENT STAGE:
// ${stageName}

// STAGE PURPOSE:
// ${stagePurpose}

// PROSPECT'S WORDS:
// ${prospectWords || "No words recorded yet."}

// CONVERSATION CONTEXT:
// ${conversationContext || "No previous context available."}

// Return:
// 1. suggested_response: A natural response the caller can say.
// 2. follow_up_question: One useful question to ask.
// 3. coaching_tip: One short practical tip.

// Rules:
// - Be concise and conversational.
// - Do not invent information about the prospect.
// - Never pressure the prospect.
// - Respect requests to stop contacting them.
// - Tailor suggestions to the current stage.
// - Return valid JSON only.
// `;

//   const response = await ai.models.generateContent({
//     model: "gemini-3.8-flash",
//     contents: prompt,
//     config: {
//       responseMimeType: "application/json",
//       responseSchema: {
//         type: "OBJECT",
//         properties: {
//           suggested_response: { type: "STRING" },
//           follow_up_question: { type: "STRING" },
//           coaching_tip: { type: "STRING" },
//         },
//         required: [
//           "suggested_response",
//           "follow_up_question",
//           "coaching_tip",
//         ],
//       },
//     },
//   });

//   const text = response.text;

//   if (!text) {
//     throw new Error("Gemini returned an empty response.");
//   }

//   return JSON.parse(text);
// }

// module.exports = { generateCallAssistance };



const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing from backend/.env");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
];

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithFallback(prompt) {
  let lastError;

  for (const model of MODELS) {
    // Retry temporary failures twice before switching models.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Trying Gemini model: ${model}`);

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                suggested_response: { type: "STRING" },
                follow_up_question: { type: "STRING" },
                coaching_tip: { type: "STRING" },
              },
              required: [
                "suggested_response",
                "follow_up_question",
                "coaching_tip",
              ],
            },
          },
        });

        if (!response.text) {
          throw new Error("Gemini returned an empty response");
        }

        return JSON.parse(response.text);
      } catch (error) {
        lastError = error;

        const status = error.status || error.code;

        console.error(
          `Gemini ${model}, attempt ${attempt} failed:`,
          status,
          error.message
        );

        // Retry only temporary server/rate-limit failures.
        if (![429, 500, 502, 503, 504].includes(Number(status))) {
          throw error;
        }

        if (attempt < 2) {
          await sleep(1500);
        }
      }
    }

    console.log(`Switching from ${model} to next model...`);
  }

  throw lastError || new Error("All Gemini models are unavailable");
}

async function generateCallAssistance({
  stageName,
  stagePurpose,
  prospectWords,
  conversationContext,
}) {
  const prompt = `
You are an expert B2B cold-calling coach helping a sales representative
during a live call.

Current stage: ${stageName}
Stage purpose: ${stagePurpose}

Prospect's exact words:
${prospectWords || "Not provided"}

Previous conversation:
${conversationContext || "No previous context"}

Generate practical, natural, concise suggestions.

Rules:
1. Suggested response must sound human, not robotic.
2. Never invent facts about the prospect or company.
3. Do not pressure the prospect.
4. Respect objections and requests to stop contact.
5. Ask one relevant follow-up question.
6. Give one short coaching tip.
7. Keep suggestions relevant to the current stage.

Return valid JSON with:
- suggested_response
- follow_up_question
- coaching_tip
`;

  return generateWithFallback(prompt);
}

module.exports = {
  generateCallAssistance,
};
