import { getCampusContext } from "./campusContext";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const CONFIGS = [
  { version: "v1beta", model: "gemini-1.5-flash" },
  { version: "v1", model: "gemini-1.5-flash" },
  { version: "v1beta", model: "gemini-pro" },
  { version: "v1", model: "gemini-pro" },
];

export const generateCampusResponse = async (userPrompt: string) => {
  try {
    if (!GEMINI_API_KEY) {
      return "Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.";
    }

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

    // Try multiple configurations until one works
    for (const config of CONFIGS) {
      try {
        console.log(`[Omni-Intelligence] Trying ${config.version} with ${config.model}...`);
        const url = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + "\n\nUser Question: " + userPrompt }] }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`[Omni-Intelligence] Success using ${config.model} (${config.version})`);
          return data.candidates[0].content.parts[0].text;
        }
        
        const errorDetail = await response.json();
        console.warn(`[Omni-Intelligence] Failed ${config.model}:`, errorDetail.error?.message);
      } catch (e) {
        continue; // Try next config
      }
    }

    throw new Error("All Gemini configurations failed. Please ensure 'Generative Language API' is enabled in your Google Cloud Console for this specific API Key.");
    
  } catch (error: any) {
    console.error("[Omni-Intelligence] Final Error:", error);
    return `Connection Error: ${error?.message || "Something went wrong"}. Please check your Google AI Studio settings.`;
  }
};
