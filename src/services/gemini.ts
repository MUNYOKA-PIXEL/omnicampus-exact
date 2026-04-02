import { getCampusContext } from "./campusContext";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const CONFIGS = [
  { version: "v1beta", model: "gemini-2.0-flash" },
  { version: "v1beta", model: "gemini-2.5-flash" },
  { version: "v1beta", model: "gemini-flash-latest" },
  { version: "v1beta", model: "gemini-2.0-flash-lite" },
];

export const generateCampusResponse = async (userPrompt: string) => {
  try {
    if (!GEMINI_API_KEY) {
      console.error("[Omni-Intelligence] API Key not found in environment variables.");
      return "Gemini API Key is missing. Please ensure VITE_GEMINI_API_KEY is in your .env file AND you have RESTARTED your dev server (npm run dev).";
    }

    const context = await getCampusContext();
    
    const systemPrompt = `
      You are Omni-Intelligence, the official AI assistant for OmniCampus. 
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
        6. Use OmniCampus terminology.


    // Try multiple configurations until one works
    let lastErrors: string[] = [];
    for (const config of CONFIGS) {
      try {
        const url = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + "\n\nUser Question: " + userPrompt }] }]
          })
        });

        const data = await response.json();

        if (response.ok) {
          return data.candidates[0].content.parts[0].text;
        }
        
        const msg = data.error?.message || "Unknown error";
        lastErrors.push(`${config.model}: ${msg}`);
      } catch (e: any) {
        lastErrors.push(`${config.model}: Network error`);
        continue; 
      }
    }

    // FINAL DIAGNOSIS: If everything failed, ask the API what IS allowed
    try {
      const diagRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
      const diagData = await diagRes.json();
      
      if (diagData.error) {
        throw new Error(`Google API Error: ${diagData.error.message} (Code: ${diagData.error.status})`);
      }
      
      if (diagData.models) {
        const allowed = diagData.models.map((m: any) => m.name.replace("models/", ""));
        throw new Error(`Key valid, but only has access to: ${allowed.join(", ")}.`);
      }
      
      throw new Error("API returned no models and no error. Key might be restricted.");
    } catch (diagErr: any) {
      throw new Error(`Diagnosis: ${diagErr.message} | Connection: ${lastErrors[0]}`);
    }
    
  } catch (error: any) {
    console.error("[Omni-Intelligence] Final Error:", error);
    return `Connection Error: ${error?.message || "Something went wrong"}. Please check your Google AI Studio settings.`;
  }
};
