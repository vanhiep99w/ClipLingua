const GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

const MODELS = {
  FAST: "llama-3.1-8b-instant",
  BALANCED: "llama-3.3-70b-versatile",
  LONG_CONTEXT: "mixtral-8x7b-32768",
};

const API_CONFIG = {
  temperature: 0.3,
  max_tokens: 3000,
  top_p: 0.9,
  stream: false,
};

const ERROR_TYPES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  RATE_LIMIT: "RATE_LIMIT",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  UNKNOWN: "UNKNOWN",
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
  const selectedModel = (await getSetting("selectedModel")) || DEFAULT_MODEL;

  if (!apiKey) {
    throw new GroqError(ERROR_TYPES.AUTH_ERROR, "API key not configured");
  }

  let systemPrompt, userPrompt;

  if (language === "en") {
    systemPrompt =
      "You are an expert bilingual (English–Vietnamese) editor and translator. " +
      "Your job is to (1) correct and improve English text, and (2) translate it into natural, fluent Vietnamese. " +
      "Always preserve UPPERCASE_CONSTANTS and acronyms exactly as written and return only strict JSON.";

    userPrompt = `You will receive some English text.

Your tasks:
1. Correct any grammar, spelling, and punctuation errors in the English text.
2. Improve awkward or unclear sentence structures while keeping the original meaning. Avoid clumsy repetition (for example, patterns like "with ... with ...").
3. Then translate the corrected English into natural, fluent Vietnamese that sounds like a native speaker.

VERY IMPORTANT RULES:
1. Keep all UPPERCASE_CONSTANTS (tokens written in ALL CAPS with underscores) exactly as they are. Do NOT translate, expand, or modify them in any way.
   - Examples: VIRTUAL_LOCAL_ACCOUNT, API_KEY, USER_STATUS, DIRECT, REDIRECT.
2. Keep all uppercase acronyms (for example: PSP, API, URL, HTTP, ID, OTP) in uppercase. Do NOT translate or expand these acronyms.
3. Do not change the internal characters of any UPPERCASE_CONSTANT or acronym (do not add spaces, accents, or punctuation inside them).
4. Do not add explanations, comments, or any extra text outside the JSON.

Output format (MUST be valid JSON):
- Return ONLY a single JSON object with exactly these keys and no others:
  {"corrected": "corrected English text", "translated": "Vietnamese translation"}

Additional JSON requirements:
- Use double quotes for all keys and string values.
- Do NOT wrap the JSON in backticks or Markdown.
- Do NOT include trailing commas.
- Do NOT include any text before or after the JSON.`;
  } else {
    systemPrompt =
      "You are an expert Vietnamese–English translator. " +
      "Your job is to translate Vietnamese text into natural, fluent English while preserving meaning and style. " +
      "Always preserve UPPERCASE_CONSTANTS and acronyms exactly as written and return only strict JSON.";

    userPrompt = `You will receive some Vietnamese text.

Your task:
1. Translate the Vietnamese text into natural, fluent English that sounds like a native speaker.
2. Use clear, concise, and professional English. Fix any awkward phrasing that results from direct translation.

VERY IMPORTANT RULES:
1. Keep all UPPERCASE_CONSTANTS (tokens written in ALL CAPS with underscores) exactly as they are. Do NOT translate, expand, or modify them in any way.
   - Examples: VIRTUAL_LOCAL_ACCOUNT, API_KEY, USER_STATUS, DIRECT, REDIRECT.
2. Keep all uppercase acronyms (for example: PSP, API, URL, HTTP, ID, OTP) in uppercase. Do NOT translate or expand these acronyms.
3. Do not change the internal characters of any UPPERCASE_CONSTANT or acronym (do not add spaces, accents, or punctuation inside them).
4. Do not add explanations, comments, or any extra text outside the JSON.

Output format (MUST be valid JSON):
- Return ONLY a single JSON object with exactly this key and no others:
  {"translated": "English translation"}

Additional JSON requirements:
- Use double quotes for all keys and string values.
- Do NOT wrap the JSON in backticks or Markdown.
- Do NOT include trailing commas.
- Do NOT include any text before or after the JSON.`;
  }

  const payload = {
    model: selectedModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${userPrompt}\n\nText: ${text}` },
    ],
    ...API_CONFIG,
  };

  try {
    const response = await fetch(GROQ_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401 || response.status === 403) {
      throw new GroqError(ERROR_TYPES.AUTH_ERROR, "Invalid API key");
    }

    if (response.status === 429) {
      throw new GroqError(
        ERROR_TYPES.RATE_LIMIT,
        "Rate limit exceeded. Please try again later."
      );
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
      throw new GroqError(
        ERROR_TYPES.INVALID_RESPONSE,
        "No content in API response"
      );
    }

    const result = JSON.parse(content);

    if (language === "en") {
      return {
        language: "en",
        original: text,
        corrected: result.corrected,
        translated: result.translated,
      };
    } else {
      return {
        language: "vi",
        original: text,
        translated: result.translated,
      };
    }
  } catch (error) {
    if (error instanceof GroqError) {
      throw error;
    }

    if (error.name === "TypeError" || error.message.includes("fetch")) {
      throw new GroqError(
        ERROR_TYPES.NETWORK_ERROR,
        "Network error. Please check your connection.",
        error
      );
    }

    if (error instanceof SyntaxError) {
      throw new GroqError(
        ERROR_TYPES.INVALID_RESPONSE,
        "Failed to parse API response",
        error
      );
    }

    throw new GroqError(
      ERROR_TYPES.UNKNOWN,
      error.message || "Unknown error occurred",
      error
    );
  }
}
