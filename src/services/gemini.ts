import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCampusContext } from "./campusContext";

// Standard model name
const API_KEY = "AIzaSyCGSLvRWcYXsQJHchumem_r7UjJSRD1jNE";
const genAI = new GoogleGenerativeAI(API_KEY);

// List of models to try in order of preference (explicit model paths)
const MODELS_TO_TRY = ["models/gemini-1.5-flash", "models/gemini-1.5-pro", "models/gemini-pro"];

export const generateCampusResponse = async (userPrompt: string) => {
  const context = await getCampusContext();
  
  const systemPrompt = `
    You are Omni-Intelligence, the official AI assistant for OmniCampus at USIU-Africa. 
    Your goal is to help students navigate campus life efficiently.
    
    Current Campus Context:
    - Available Books: ${context.availableBooks.join(", ") || "None currently listed"}
    - Upcoming Events: ${context.upcomingEvents.join(", ") || "None scheduled"}
    - Doctors Available: ${context.medicalAvailability.join(", ") || "No doctors currently available"}
    - Recent Lost & Found: ${context.recentLostFound.join(", ") || "No recent reports"}
    
    Guidelines:
    1. Be professional, helpful, and energetic.
    2. If asked about library books, mention specifically available ones if they match the query.
    3. If asked about health, suggest booking with available doctors.
    4. If asked about lost items, refer them to the Lost & Found page.
    5. Keep responses concise and use markdown for formatting.
    6. If you don't know something about the specific campus data, admit it and suggest visiting the relevant page.
    7. Use USIU-Africa terminology (e.g., mention the campus name if relevant).
  `;

  // Try each model until one succeeds
  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`[Omni-Intelligence] Attempting with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error";
      console.error(`[Omni-Intelligence] Error with ${modelName}:`, errorMessage);
      
      // If the error isn't a 404, report it directly (could be rate limit, etc.)
      if (!errorMessage.includes("404")) {
        return `I encountered an issue (Error: ${errorMessage}). Please try again in a few seconds.`;
      }
      
      // If we've reached the end of the list and all failed with 404
      if (modelName === MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) {
        return "I'm having trouble finding a compatible AI model. This usually means the API key is restricted or the 'Generative Language API' is disabled in your Google Cloud Console.";
      }
    }
  }
  
  return "I'm unable to connect to the campus intelligence right now.";
};
