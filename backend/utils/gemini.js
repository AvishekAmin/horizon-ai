import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

let aiClient = null;

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in Backend environment variables.",
    );
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }

  return aiClient;
}

function buildPromptWithHistory(currentMessage, history = []) {
  if (!history || history.length === 0) {
    return currentMessage;
  }

  const recentHistory = history.slice(-8);
  const formattedLines = recentHistory.map((msg) => {
    const roleLabel = msg.role === "user" ? "User" : "Horizon AI";
    return `${roleLabel}: ${msg.content}`;
  });

  return (
    `System: You are Horizon AI, an intelligent, helpful, and concise conversational AI assistant.\n\n` +
    `Previous Conversation:\n` +
    formattedLines.join("\n\n") +
    `\n\nUser: ${currentMessage}\n\nHorizon AI:`
  );
}

function extractResponseText(interaction) {
  if (!interaction) return null;
  if (interaction.output_text && typeof interaction.output_text === "string") {
    return interaction.output_text.trim();
  }
  if (typeof interaction.text === "string") {
    return interaction.text.trim();
  }
  if (
    Array.isArray(interaction.candidates) &&
    interaction.candidates[0]?.content?.parts?.[0]?.text
  ) {
    return interaction.candidates[0].content.parts[0].text.trim();
  }
  return null;
}

export async function getGeminiAPIResponse(message, history = []) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message cannot be empty.");
  }

  const ai = getAIClient();
  const prompt = buildPromptWithHistory(message.trim(), history);

  const models = ["gemini-3.8-flash", "gemini-3.6-flash"];
  let lastError = null;

  for (const model of models) {
    try {
      const interaction = await ai.interactions.create({
        model,
        input: prompt,
      });

      const text = extractResponseText(interaction);
      if (text) {
        return text;
      }
    } catch (error) {
      console.warn(
        `Interactions call failed on ${model}:`,
        error?.message || error,
      );
      lastError = error;

      const msg = error?.message || "";
      const isQuotaOrModelIssue =
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("quota") ||
        msg.includes("too_many_requests") ||
        msg.includes("404") ||
        msg.includes("not available");

      if (!isQuotaOrModelIssue) {
        if (msg.includes("API_KEY_INVALID") || msg.includes("401")) {
          const authErr = new Error(
            "Invalid Gemini API key. Please check your Backend/.env configuration.",
          );
          authErr.statusCode = 401;
          throw authErr;
        }
      }
    }
  }

  console.error("All Gemini models exhausted. Final error:", lastError);
  const errorMessage = lastError?.message || "";
  const errorCode =
    lastError?.status || lastError?.code || lastError?.error?.code;

  if (
    errorMessage.includes("429") ||
    errorMessage.includes("RESOURCE_EXHAUSTED") ||
    errorMessage.includes("quota") ||
    errorMessage.includes("too_many_requests") ||
    errorCode === 429
  ) {
    let retryHint = " Please wait a moment before sending another message.";
    const retryMatch = errorMessage.match(/retry in\s+([0-9.]+)/i);
    if (retryMatch) {
      const seconds = Math.ceil(parseFloat(retryMatch[1]));
      retryHint = ` Please retry in ${seconds} seconds.`;
    }

    const quotaErr = new Error(
      `Gemini API free-tier rate limit reached.${retryHint}`,
    );
    quotaErr.isQuota = true;
    quotaErr.statusCode = 429;
    throw quotaErr;
  }

  const genericErr = new Error(
    "Horizon AI was unable to generate a response at this time. Please try again.",
  );
  genericErr.statusCode = 500;
  throw genericErr;
}

export default getGeminiAPIResponse;
