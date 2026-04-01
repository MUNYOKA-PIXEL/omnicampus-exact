import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCampusContext } from "./campusContext";

// Standard model name
const API_KEY = "AIzaSyCGSLvRWcYXsQJHchumem_r7UjJSRD1jNE";

// Initialize with explicit v1beta version
const genAI = new GoogleGenerativeAI(API_KEY);

// List of models to try in order of preference
const MODELS_TO_TRY = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

export const generateCampusResponse = async (userPrompt: string) => {
  try {
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
      6. Use USIU-Africa terminology.
    `;

    // Attempt models sequentially
    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`[Omni-Intelligence] Requesting ${modelName}...`);
        // Force v1beta specifically for these models
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: "v1beta" });
        
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\nUser Query: " + userPrompt }] }]
        });
        
        const response = await result.response;
        const text = response.text();
        if (text) return text;
      } catch (err: any) {
        console.warn(`[Omni-Intelligence] ${modelName} failed:`, err.message);
        if (modelName === MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) throw err;
      }
    }
  } catch (error: any) {
    console.error("[Omni-Intelligence] Final Error:", error);
    return `Connection Error: ${error?.message || "Unknown"}. Please ensure your API key has the 'Generative Language API' enabled in Google AI Studio.`;
  }
  
  return "I'm unable to connect to the campus intelligence right now.";
};
