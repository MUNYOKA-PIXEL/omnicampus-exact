import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCampusContext } from "./campusContext";

// Final refined service for stability
const API_KEY = "AIzaSyB-VTiRjAw1CRo8-8swn5J50gS5kthaBfE";
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateCampusResponse = async (userPrompt: string) => {
  try {
    const context = await getCampusContext();
    
    // Using the most widely available model with default settings
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
    console.error("[Omni-Intelligence] Connection Error:", error);
    
    // Provide actionable advice for 404 errors
    if (error?.message?.includes("404")) {
      return "Model not found (404). This almost always means the 'Generative Language API' is NOT enabled for your API key. Please enable it in Google AI Studio or Google Cloud Console.";
    }
    
    return `Connection Error: ${error?.message || "Something went wrong"}. Please try again later.`;
  }
};
