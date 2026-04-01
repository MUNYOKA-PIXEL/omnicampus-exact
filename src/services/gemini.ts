import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCampusContext } from "./campusContext";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
      6. If you don't know something about the specific campus data, admit it and suggest visiting the relevant page.
      7. Use USIU-Africa terminology (e.g., mention the campus name if relevant).
    `;

    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having a bit of trouble connecting to my campus intelligence right now. Please try again in a moment, or visit the relevant page manually!";
  }
};
