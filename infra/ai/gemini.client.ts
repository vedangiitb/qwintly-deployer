import {
  FunctionCallingConfigMode,
  GenerateContentConfig,
  GoogleGenAI,
  Tool,
} from "@google/genai";
import { GOOGLE_GENAI_API_KEY } from "../../config/env.js";

if (!GOOGLE_GENAI_API_KEY) {
  throw new Error("GOOGLE_GENAI_API_KEY is not defined");
}

export const ai = new GoogleGenAI({
  apiKey: GOOGLE_GENAI_API_KEY,
});

type AIResponseOptions = {
  tools?: Tool[];
  model?: string;
};

const DEFAULT_MODEL = "gemini-2.0-flash";

export async function aiResponse(
  request: string | string[],
  options: AIResponseOptions = {}
) {
  const { tools, model = DEFAULT_MODEL } = options;

  const config: GenerateContentConfig = {};

  // Tool calling has highest priority
  if (tools && tools.length > 0) {
    config.tools = tools;
    config.toolConfig = {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.ANY,
      },
    };
  }

  try {
    return await ai.models.generateContent({
      model,
      contents: request,
      ...(Object.keys(config).length > 0 && { config }),
    });
  } catch (err: any) {
    throw new Error(`AI generation failed: ${err?.message || "Unknown error"}`);
  }
}
