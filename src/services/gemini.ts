import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCampusContext } from "./campusContext";

// Standard model name
const API_KEY = "AIzaSyCJs-l4ul-am84TTW4MT9WlP47ttG95c3s";
const genAI = new GoogleGenerativeAI(API_KEY);

// List of models to try in order of preference
const MODELS_TO_TRY = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

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
      console.log(`Attempting Gemini with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error(`Error with model ${modelName}:`, error);
      
      // If it's NOT a 404, it might be a different issue (like quota or safety), 
      // but if it IS a 404, we continue to the next model in the list.
      if (!error?.message?.includes("404")) {
        return `I encountered an error: ${error?.message || "Connection failed"}. Please try again.`;
      }
      
      // If we've tried all models and still get 404s
      if (modelName === MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) {
        return "I'm having trouble finding a compatible AI model. Please ensure the 'Generative Language API' is enabled in your Google AI Studio or Cloud Console.";
      }
      
      console.log(`Model ${modelName} not found, trying next...`);
    }
  }
  
  return "I'm unable to connect to the campus intelligence right now.";
};
