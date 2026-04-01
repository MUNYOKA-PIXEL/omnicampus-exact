import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCampusContext } from "./campusContext";

// Use environment variable for security. 
// DO NOT HARDCODE. Google will revoke keys pushed to public repos.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateCampusResponse = async (userPrompt: string) => {
  try {
    if (!API_KEY) {
      return "Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.";
    }

    // DEBUG: If the user types "list-models", we will try to list what's available
    if (userPrompt.toLowerCase() === "debug-models") {
      try {
        // This is a bit hacky but helps us see if the key works at all
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();
        return "Available Models: " + JSON.stringify(data.models?.map((m: any) => m.name.replace("models/", "")));
      } catch (e: any) {
        return "Failed to list models: " + e.message;
      }
    }

    const context = await getCampusContext();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
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

    const result = await model.generateContent(systemPrompt + "\n\nUser Query: " + userPrompt);
    const response = await result.response;
    return response.text();
    
  } catch (error: any) {
    console.error("[Omni-Intelligence] Error:", error);
    
    if (error?.message?.includes("404")) {
      return "Model not found (404). Ensure 'Generative Language API' is enabled in Google Cloud and that your API key is valid and NOT revoked.";
    }
    
    return `Connection Error: ${error?.message || "Something went wrong"}. Please check your configuration.`;
  }
};
