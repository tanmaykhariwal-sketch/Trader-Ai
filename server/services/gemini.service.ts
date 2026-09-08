import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

export const ai: GoogleGenAI | null = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    })
  : null;
