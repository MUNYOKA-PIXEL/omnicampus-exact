import { getCampusContext } from "./campusContext";
import { toolRegistry } from "./tools";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const CONFIGS = [
  { version: "v1beta", model: "gemini-2.0-flash" },
  { version: "v1beta", model: "gemini-2.5-flash" },
  { version: "v1beta", model: "gemini-flash-latest" },
  { version: "v1beta", model: "gemini-2.0-flash-lite" },
];

export const generateCampusResponse = async (
  userPrompt: string, 
  userProfile?: { course?: string | null; year_of_study?: number | null }, 
  userId?: string
) => {
  try {
    if (!GEMINI_API_KEY) {
      console.error("[Omni-Intelligence] API Key not found in environment variables.");
      return "Gemini API Key is missing. Please ensure VITE_GEMINI_API_KEY is in your .env file AND you have RESTARTED your dev server (npm run dev).";
    }

    const context = await getCampusContext();
    
    const systemPrompt = `
      You are Omni-Intelligence, the official USIU-Africa Campus Agent. 
      Your goal is to help students navigate campus life efficiently.

      Student Profile:
      - Major: ${userProfile?.course || "Not specified"}
      - Year of Study: ${userProfile?.year_of_study || "Not specified"}
      - Student ID (UUID): ${userId || "Not specified"}

      Current Campus Context:
      - Available Books: ${context.availableBooks.join(", ") || "None currently listed"}
      - Upcoming Events: ${context.upcomingEvents.join(", ") || "None scheduled"}
      - Doctors Available: ${context.medicalAvailability.join(", ") || "No doctors currently available"}
      - Recent Lost & Found: ${context.recentLostFound.join(", ") || "No recent reports"}

      Guidelines:
      1. Be professional, helpful, and energetic.
      2. If asked about library books, mention specifically available ones if they match the query.
      3. If asked about health, suggest booking with available doctors.
      4. Use USIU-Africa and OmniCampus terminology.
      5. When using tools, always summarize the results for the student in a helpful way.
      6. If a tool fails, provide a polite fallback explanation.
      7. Use the provided Student ID (UUID) for any tool calls that require a userId.
    `;

    const tools = [
      {
        function_declarations: [
          {
            name: "countAppointments",
            description: "Get the count of appointments for the current user.",
            parameters: {
              type: "object",
              properties: {
                userId: { type: "string", description: "The UUID of the logged-in student." }
              },
              required: ["userId"]
            }
          },
          {
            name: "readAppointments",
            description: "Retrieve a list of upcoming appointments for the current user.",
            parameters: {
              type: "object",
              properties: {
                userId: { type: "string", description: "The UUID of the logged-in student." }
              },
              required: ["userId"]
            }
          },
          {
            name: "insertAppointment",
            description: "Books a new medical appointment for the student.",
            parameters: {
              type: "object",
              properties: {
                user_id: { type: "string", description: "The student's UUID." },
                doctor_id: { type: "string", description: "The doctor's UUID." },
                date: { type: "string", description: "Appointment date (YYYY-MM-DD)." },
                time: { type: "string", description: "Appointment time (e.g., '10:00 AM')." },
                reason: { type: "string", description: "Optional reason for the visit." }
              },
              required: ["user_id", "doctor_id", "date", "time"]
            }
          },
          {
            name: "countCourses",
            description: "Get the total number of available courses at USIU-Africa.",
            parameters: { type: "object", properties: {} }
          },
          {
            name: "readCourses",
            description: "List available courses in the USIU-Africa catalog.",
            parameters: { type: "object", properties: {} }
          }
        ]
      }
    ];

    const lastErrors: string[] = [];
    for (const config of CONFIGS) {
      try {
        const url = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${GEMINI_API_KEY}`;
        
        const initialRequest = {
          contents: [{ parts: [{ text: systemPrompt + "\n\nUser Question: " + userPrompt }] }],
          tools: tools
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(initialRequest)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Gemini API Error");

        const candidate = data.candidates?.[0];
        const part = candidate?.content?.parts?.[0];

        // Handle Function Calling
        if (part?.functionCall) {
          const { name, args } = part.functionCall;
          const toolFn = toolRegistry[name];
          
          if (toolFn) {
            const toolResult = await toolFn(args);
            
            // Second call to provide the result back to Gemini
            const secondResponse = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  { parts: [{ text: systemPrompt + "\n\nUser Question: " + userPrompt }] },
                  candidate.content,
                  {
                    parts: [{
                      functionResponse: {
                        name: name,
                        response: { content: toolResult }
                      }
                    }]
                  }
                ],
                tools: tools
              })
            });

            const finalData = await secondResponse.json();
            if (secondResponse.ok) {
              return finalData.candidates[0].content.parts[0].text;
            }
          }
        }

        if (part?.text) {
          return part.text;
        }
        
        lastErrors.push(`${config.model}: No valid part returned`);
      } catch (e: unknown) {
        const error = e as Error;
        lastErrors.push(`${config.model}: ${error.message}`);
        continue; 
      }
    }

    throw new Error(`All models failed. Last error: ${lastErrors[0]}`);
    
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[USIU Campus Agent] Error:", err);
    return `Connection Error: ${err.message || "Something went wrong"}. I'm having trouble accessing USIU campus data right now.`;
  }
};
