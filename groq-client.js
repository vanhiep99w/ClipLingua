const GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

const MODELS = {
  FAST: "llama-3.1-8b-instant",
  BALANCED: "llama-3.3-70b-versatile",
  LONG_CONTEXT: "mixtral-8x7b-32768"
};

const API_CONFIG = {
  temperature: 0.3,
  max_tokens: 2000,
  top_p: 0.9,
  stream: false
};

const ERROR_TYPES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  RATE_LIMIT: "RATE_LIMIT",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  UNKNOWN: "UNKNOWN"
};

class GroqError extends Error {
  constructor(type, message, originalError = null) {
    super(message);
    this.type = type;
    this.originalError = originalError;
    this.name = "GroqError";
  }
}

async function translateAndCorrect(text, language) {
  const apiKey = await getSetting("groqApiKey");
  const selectedModel = await getSetting("selectedModel") || DEFAULT_MODEL;

  if (!apiKey) {
    throw new GroqError(ERROR_TYPES.AUTH_ERROR, "API key not configured");
  }

  let systemPrompt, userPrompt;

  if (language === "en") {
    systemPrompt = "You are a helpful assistant that fixes English grammar and typos, then translates to natural Vietnamese.";
    userPrompt = `Fix any grammar errors and typos in this English text, then translate it to natural Vietnamese. Return ONLY a JSON object with this exact format: {"corrected": "corrected English text", "translated": "Vietnamese translation"}`;
  } else {
    systemPrompt = "You are a helpful assistant that translates Vietnamese to natural English.";
    userPrompt = `Translate this Vietnamese text to natural, fluent English. Return ONLY a JSON object with this exact format: {"translated": "English translation"}`;
  }

  const payload = {
    model: selectedModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${userPrompt}\n\nText: ${text}` }
    ],
    ...API_CONFIG
  };

  try {
    const response = await fetch(GROQ_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 401 || response.status === 403) {
      throw new GroqError(ERROR_TYPES.AUTH_ERROR, "Invalid API key");
    }

    if (response.status === 429) {
      throw new GroqError(ERROR_TYPES.RATE_LIMIT, "Rate limit exceeded. Please try again later.");
    }

    if (!response.ok) {
      throw new GroqError(
        ERROR_TYPES.UNKNOWN,
        `API request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new GroqError(ERROR_TYPES.INVALID_RESPONSE, "No content in API response");
    }

    const result = JSON.parse(content);

    if (language === "en") {
      return {
        language: "en",
        original: text,
        corrected: result.corrected,
        translated: result.translated
      };
    } else {
      return {
        language: "vi",
        original: text,
        translated: result.translated
      };
    }

  } catch (error) {
    if (error instanceof GroqError) {
      throw error;
    }

    if (error.name === "TypeError" || error.message.includes("fetch")) {
      throw new GroqError(ERROR_TYPES.NETWORK_ERROR, "Network error. Please check your connection.", error);
    }

    if (error instanceof SyntaxError) {
      throw new GroqError(ERROR_TYPES.INVALID_RESPONSE, "Failed to parse API response", error);
    }

    throw new GroqError(ERROR_TYPES.UNKNOWN, error.message || "Unknown error occurred", error);
  }
}
