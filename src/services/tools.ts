import { supabase } from "@/integrations/supabase/client";

/**
 * Counts the number of appointments for a specific user.
 */
export const countAppointments = async ({ userId }: { userId: string }) => {
  try {
    const { count, error } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    
    if (error) throw error;
    return `You have ${count || 0} appointments scheduled.`;
  } catch (error) {
    console.error("Error counting appointments:", error);
    return "I couldn't retrieve your appointment count right now.";
  }
};

/**
 * Reads upcoming appointments for a specific user.
 */
export const readAppointments = async ({ userId }: { userId: string }) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, doctors(name)")
      .eq("user_id", userId)
      .order("date", { ascending: true });
    
    if (error) throw error;
    if (!data || data.length === 0) return "You have no upcoming appointments.";
    
    const list = data.map(a => `- ${a.date} at ${a.time} with Dr. ${a.doctors?.name || 'Unknown'} (Reason: ${a.reason || 'None'})`).join("\n");
    return `Here are your upcoming appointments:\n${list}`;
  } catch (error) {
    console.error("Error reading appointments:", error);
    return "I'm having trouble reading your appointments list.";
  }
};

/**
 * Books a new appointment for a student.
 */
export const insertAppointment = async (args: { user_id: string; doctor_id: string; date: string; time: string; reason?: string }) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .insert([args])
      .select();
    
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("No data returned after insert");
    
    // Audit log for security
    await supabase.from("ai_audit_logs").insert({
      user_id: args.user_id,
      action: "AI_BOOK_APPOINTMENT",
      details: { ...args, appointment_id: data[0].id }
    });
    
    return `Successfully booked your appointment for ${args.date} at ${args.time}. Reference ID: ${data[0].id}`;
  } catch (error) {
    console.error("Error inserting appointment:", error);
    return "I failed to book that appointment. Please ensure the Date (YYYY-MM-DD) and Time are valid, or try again later.";
  }
};

/**
 * Counts total available courses in the USIU catalog.
 */
export const countCourses = async () => {
  try {
    const { count, error } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true });
    
    if (error) throw error;
    return `There are currently ${count || 0} courses available in the USIU catalog.`;
  } catch (error) {
    console.error("Error counting courses:", error);
    return "I couldn't fetch the course count from the database.";
  }
};

/**
 * Lists available courses.
 */
export const readCourses = async () => {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .limit(10);
    
    if (error) throw error;
    if (!data || data.length === 0) return "No courses are currently listed in the system.";
    
    const list = data.map(c => `- ${c.name} (${c.department}) - ${c.credits} Credits`).join("\n");
    return `Here are some available courses:\n${list}`;
  } catch (error) {
    console.error("Error reading courses:", error);
    return "I'm having trouble listing the courses right now.";
  }
};

// Map of tool names to their implementation functions
export const toolRegistry: Record<string, (args: Record<string, any>) => Promise<string>> = {
  countAppointments: (args: { userId: string }) => countAppointments(args),
  readAppointments: (args: { userId: string }) => readAppointments(args),
  insertAppointment: (args: { user_id: string; doctor_id: string; date: string; time: string; reason?: string }) => insertAppointment(args),
  countCourses: () => countCourses(),
  readCourses: () => readCourses()
};
