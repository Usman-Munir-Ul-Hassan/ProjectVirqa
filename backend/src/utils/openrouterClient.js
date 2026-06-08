// backend/src/utils/openrouterClient.js

/**
 * Fetches an AI response using a full conversation history from Groq (primary) or OpenRouter (fallback).
 * @param {Array} messages - Array of message objects { role: "system"|"user"|"assistant", content: "..." }
 * @param {Object} options - Optional settings: { temperature: 0.3, max_tokens: 2048 }
 */
export const fetchAIChat = async (messages, options = {}) => {
  const { temperature = 0.7, max_tokens = 2048 } = options;

  // 1. Try Groq first with Llama 3.1
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: messages,
          temperature: temperature,
          max_tokens: max_tokens,
        }),
      });

      const data = await response.json();
      if (!data.error) {
        return data;
      }
      console.error("Groq API error, falling back to OpenRouter:", data.error);
    } catch (err) {
      console.error("Groq network error, falling back to OpenRouter:", err);
    }
  }

  // 2. Fallback to OpenRouter
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || "Error from OpenRouter");
  }
  return data;
};

/**
 * Fetches an AI prompt from using the provided prompt input.
 * Returns the parsed JSON response.
 */
export const fetchAIPrompt = async (promptInput) => {
  return fetchAIChat([{ role: "user", content: promptInput }]);
};

export default { fetchAIPrompt, fetchAIChat };
