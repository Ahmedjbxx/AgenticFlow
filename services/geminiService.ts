
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';

// The API key MUST be obtained exclusively from the environment variable process.env.API_KEY.
// This variable is assumed to be pre-configured in the execution environment.
const API_KEY = process.env.API_KEY;

if (!API_KEY && process.env.NODE_ENV !== "test") {
  console.warn(
    "Gemini API key (process.env.API_KEY) is not configured. " +
    "Using a mock response will result in API errors if you expect real data. " +
    "Ensure API_KEY is set in your environment for live API calls."
  );
}

// Initialize AI client. If API_KEY is undefined, calls will fail, which is expected
// if the key is not provided by the environment. The mock logic below handles this for dev.
const ai = new GoogleGenAI({ apiKey: API_KEY || "FALLBACK_DEV_ONLY_INVALID_KEY" }); // Provide a string, even if invalid, to satisfy constructor

/**
 * Generates text content using the Gemini API.
 * @param prompt The text prompt to send to the model.
 * @returns A promise that resolves to the generated text.
 */
export const generateText = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    console.warn("Gemini API call skipped: API_KEY not configured in environment.");
    // Simulate a delay and provide a mock response for UI testing without a real key
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `Mocked LLM Response for prompt: "${prompt.substring(0, 50)}..." (API_KEY not set)`;
  }

  try {
    // The 'contents' field should be a simple string for single text prompts,
    // or an array of Content objects for more complex scenarios (e.g., multimodal).
    // The example in the prompt used `contents: 'why is the sky blue?'`.
    // The existing code uses `contents: [{ role: "user", parts: [{text: prompt}] }]` which is also valid.
    // We will keep the more structured version as it's robust.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME, 
      contents: [{ role: "user", parts: [{text: prompt}] }],
      // config: { // Optional configurations
        // temperature: 0.7,
        // topK: 64,
        // topP: 0.95,
        // thinkingConfig: { thinkingBudget: 0 } // Example: disable thinking for gemini-2.5-flash-preview-04-17 if needed
      // }
    });
    
    const text = response.text;
    if (typeof text !== 'string') {
        console.error("Gemini API returned non-text response:", response);
        throw new Error("Unexpected response format from Gemini API.");
    }
    return text;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof Error) {
      // Check for common API key related errors if possible, though SDK might abstract these
      if (error.message.includes("API key not valid")) {
        return "Error from Gemini: API key is not valid. Please check your configuration.";
      }
      return `Error from Gemini: ${error.message}`;
    }
    return "An unexpected error occurred with the Gemini API.";
  }
};

// Example of image generation (not used in current MVP flow, but good for reference)
/*
import { IMAGEN_MODEL_NAME } from '../constants';

export const generateImage = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    console.warn("Imagen API call skipped: API_KEY not configured.");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Mock</text></svg>`; // Placeholder image
  }
  try {
    const response = await ai.models.generateImages({
      model: IMAGEN_MODEL_NAME,
      prompt: prompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error("No image generated or unexpected response format.");
  } catch (error) {
    console.error('Error calling Imagen API:', error);
    if (error instanceof Error) {
      return `Error from Imagen: ${error.message}`;
    }
    return "An unexpected error occurred with the Imagen API.";
  }
};
*/
