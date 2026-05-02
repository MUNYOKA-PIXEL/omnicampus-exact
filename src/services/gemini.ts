import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCampusContext } from "./campusContext";
import { toolRegistry } from "./tools";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
];

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const generateCampusResponse = async (
  userPrompt: string, 
  userProfile?: { course?: string | null; year_of_study?: number | null }, 
  userId?: string
) => {
  try {
    if (!GEMINI_API_KEY) {
      console.error("[Omni-Intelligence] API Key not found.");
      return "The AI Agent's API Key is missing. Please contact your USIU system administrator.";
    }

    const context = await getCampusContext();
    
    const systemPrompt = `
      You are Omni-Intelligence, the official USIU-Africa Campus Agent. 
      Your goal is to help students navigate campus life efficiently.

      Student Profile:
      - Course: ${userProfile?.course || "Not specified"}
      - Year of Study: ${userProfile?.year_of_study || "Not specified"}

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
      7. NEVER ask the student for their Student ID or UUID. You have silent access to it.
    `;

    const toolDeclarations = [
      {
        name: "countAppointments",
        description: "Get the count of appointments for the current user.",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "readAppointments",
        description: "Retrieve a list of upcoming appointments for the current user.",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "insertAppointment",
        description: "Books a new medical appointment for the student.",
        parameters: {
          type: "OBJECT",
          properties: {
            doctor_id: { type: "STRING", description: "The doctor's UUID." },
            date: { type: "STRING", description: "Appointment date (YYYY-MM-DD)." },
            time: { type: "STRING", description: "Appointment time (e.g., '10:00 AM')." },
            reason: { type: "STRING", description: "Optional reason for the visit." }
          },
          required: ["doctor_id", "date", "time"]
        }
      },
      {
        name: "countCourses",
        description: "Get the total number of available courses at USIU-Africa.",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "readCourses",
        description: "List available courses in the USIU-Africa catalog.",
        parameters: { type: "OBJECT", properties: {} }
      }
    ];

    const lastErrors: string[] = [];
    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          tools: [{ functionDeclarations: toolDeclarations as any }]
        });

        const chat = model.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: systemPrompt }],
            },
            {
              role: "model",
              parts: [{ text: "Understood. I am Omni-Intelligence, and I am ready to assist USIU students using the campus records." }],
            },
          ],
        });

        const result = await chat.sendMessage(userPrompt);
        const response = result.response;
        const part = response.candidates?.[0]?.content?.parts?.[0];

        if (part?.functionCall) {
          const { name, args } = part.functionCall;
          const toolFn = toolRegistry[name];
          
          if (toolFn) {
            const toolResult = await toolFn(userId || "", args);
            
            const secondResult = await chat.sendMessage([
              {
                functionResponse: {
                  name: name,
                  response: { content: toolResult }
                }
              }
            ]);
            
            return secondResult.response.text();
          }
        }

        return response.text();
      } catch (e: unknown) {
        const error = e as Error;
        console.warn(`[Gemini Fallback] Model ${modelName} failed:`, error.message);
        lastErrors.push(`${modelName}: ${error.message}`);
        continue; 
      }
    }

    throw new Error(`All AI models failed. Last error: ${lastErrors[0]}`);
    
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[USIU Campus Agent] Final Error:", err);
    return `Connection Error: ${err.message}. I'm having trouble accessing USIU campus data right now. Please try again later.`;
  }
};
