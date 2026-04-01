import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCampusContext } from "./campusContext";

// Standard model name
const API_KEY = "AIzaSyCJs-l4ul-am84TTW4MT9WlP47ttG95c3s";
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateCampusResponse = async (userPrompt: string) => {
  try {
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
      6. If you don't know something about the specific campus data, admit it and suggest visiting the relevant page.
      7. Use USIU-Africa terminology (e.g., mention the campus name if relevant).
    `;

    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    let detail = error?.message || "Unknown error";
    if (detail.includes("404")) detail = "Model not found (404). This usually means the API key doesn't have access to this specific model name.";
    
    return `I'm having trouble connecting. (Detail: ${detail}). If this persists, please ensure your API key has the "Generative Language API" enabled in Google Cloud Console.`;
  }
};
