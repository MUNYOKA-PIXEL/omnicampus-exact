import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, Users, AlertTriangle, Clock, CalendarCheck, Bot, Lightbulb, Book, Send, ShieldCheck, UserCog, TrendingUp, Activity, Search, Trash2, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { generateCampusResponse } from "@/services/gemini";

const Dashboard = () => {
  const { user, profile, role } = useAuth();
  const isSuperAdmin = role === "superadmin";
  
  const [chatMessages, setChatMessages] = useState([
    { type: "bot", text: "Hello! I'm Omni-Intelligence, your campus assistant. Ask me anything about library books, clubs, or medical services!" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Live stats
  const [booksBorrowed, setBooksBorrowed] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [activeClubs, setActiveClubs] = useState(0);
  const [overdueFines, setOverdueFines] = useState(0);
  
  // Admin Global Stats
  const [globalStats, setGlobalStats] = useState({ users: 0, appointments: 0, inventory: 0, items: 0 });
  
  const [loans, setLoans] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchDashboard = async () => {
      setLoading(true);
      const promises = [
        supabase.from("book_loans").select("*, books(title)").eq("user_id", user.id).order("issue_date", { ascending: false }).limit(5),
        supabase.from("club_memberships").select("club_id").eq("user_id", user.id),
        supabase.from("club_events").select("*, clubs(name)").gte("date", new Date().toISOString().split("T")[0]).order("date").limit(5),
        supabase.from("books").select("*").eq("available", true).limit(3),
      ];

      if (isSuperAdmin) {
        promises.push(
          supabase.from("profiles").select("*, user_roles(role)"),
          supabase.from("profiles").select("id", { count: "exact" }),
          supabase.from("appointments").select("id", { count: "exact" }),
          supabase.from("books").select("id", { count: "exact" }),
          supabase.from("lost_found_items").select("id", { count: "exact" })
        );
      }

      const results = await Promise.all(promises);
      
      const userLoans = results[0].data || [];
      setLoans(userLoans);
      const activeLoans = userLoans.filter((l: any) => l.status === "active");
      setBooksBorrowed(activeLoans.length);
      setOverdueFines(userLoans.reduce((sum: number, l: any) => sum + (l.fine_amount || 0), 0));

      setActiveClubs((results[1].data || []).length);
      setEvents(results[2].data || []);
      setUpcomingEvents((results[2].data || []).length);
      setRecommendedBooks(results[3].data || []);

      if (isSuperAdmin) {
        setUserList(results[4].data || []);
        setGlobalStats({
          users: results[5].count || 0,
          appointments: results[6].count || 0,
          inventory: results[7].count || 0,
          items: results[8].count || 0
        });
      }
      setLoading(false);
    };
    fetchDashboard();
  }, [user, role]);

  const sendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;
    
    const userMessage = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { type: "user", text: userMessage }]);
    setIsTyping(true);

    try {
      const response = await generateCampusResponse(userMessage);
      setChatMessages((prev) => [...prev, { type: "bot", text: response }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { type: "bot", text: "I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("user_id", userId);
    if (error) toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Role Updated", description: `User role is now ${newRole}.` });
      // Refresh user list
      const { data } = await supabase.from("profiles").select("*, user_roles(role)");
      if (data) setUserList(data);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-[2.2rem] font-semibold text-primary">{isSuperAdmin ? "System Oversight" : "Student Dashboard"}</h1>
          <p className="text-muted-foreground">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}! Role: <span className="font-bold text-accent uppercase">{role}</span></p>
        </div>
        {isSuperAdmin && (
          <div className="flex gap-3">
            <div className="px-4 py-2 bg-[#008000]/10 border border-[#008000]/20 rounded-md flex items-center gap-2 text-[#008000]">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">System Online</span>
            </div>
          </div>
        )}
      </div>

      {/* --- SUPER ADMIN GLOBAL STATS --- */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-in fade-in duration-500">
          {[
            { icon: UserCog, value: String(globalStats.users), label: "Registered Users", color: "rgba(0,51,102,0.1)" },
            { icon: Activity, value: String(globalStats.appointments), label: "Health Cases", color: "rgba(204,0,0,0.05)" },
            { icon: Book, value: String(globalStats.inventory), label: "Library Assets", color: "rgba(0,128,0,0.05)" },
            { icon: TrendingUp, value: String(globalStats.items), label: "Items Reported", color: "rgba(255,215,0,0.1)" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-8 flex items-center gap-6 shadow-usiu hover:border-accent transition-all">
                <div className="p-4 rounded-xl" style={{ background: stat.color }}>
                  <Icon className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-[1.8rem] font-black text-primary leading-none mb-1">{stat.value}</h3>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- STUDENT STATS (REMOVED FROM TOP, INTEGRATED BELOW) --- */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- LEFT COLUMN --- */}
        <div className="space-y-8">
          
          {/* ... (Super Admin Section remains same) ... */}

          {/* Active Borrowing (Integrated Stats) */}
          {!isSuperAdmin && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-usiu transition-all hover:border-accent/40">
              <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-primary">
                <h3 className="text-white font-bold flex items-center gap-3">
                  <Clock className="w-5 h-5 text-accent" /> Active Borrowing
                </h3>
                <div className="flex gap-4 items-center">
                  <div className="text-right">
                    <p className="text-[10px] text-white/60 font-black uppercase leading-none">Possession</p>
                    <p className="text-lg font-black text-accent leading-none">{booksBorrowed}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-right">
                    <p className="text-[10px] text-white/60 font-black uppercase leading-none">Fines</p>
                    <p className="text-lg font-black text-destructive leading-none">KES {overdueFines}</p>
                  </div>
                </div>
              </div>
              <div className="p-0">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left p-4 text-[10px] font-black uppercase text-muted-foreground">Book Title</th>
                      <th className="text-left p-4 text-[10px] font-black uppercase text-muted-foreground">Due Date</th>
                      <th className="text-right p-4 text-[10px] font-black uppercase text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.filter(l => l.status === "active").length === 0 ? (
                      <tr><td colSpan={3} className="p-12 text-center text-muted-foreground text-xs italic">No books in your possession currently.</td></tr>
                    ) : loans.filter(l => l.status === "active").map((loan: any) => {
                      const isOverdue = new Date(loan.due_date) < new Date();
                      return (
                        <tr key={loan.id} className="hover:bg-primary/5 transition-colors border-b border-border/50">
                          <td className="p-4 font-bold text-sm text-primary">{loan.books?.title || "Unknown"}</td>
                          <td className="p-4 text-xs font-medium text-muted-foreground">{new Date(loan.due_date).toLocaleDateString()}</td>
                          <td className="p-4 text-right">
                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${isOverdue ? "bg-destructive text-white" : "bg-[#008000]/10 text-[#008000]"}`}>
                              {isOverdue ? "Overdue" : "On Time"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="p-4 bg-muted/10 text-center border-t border-border">
                  <Link to="/library" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Manage All Loans →</Link>
                </div>
              </div>
            </div>
          )}

          {/* Social Involvement (Active Clubs Stat) */}
          {!isSuperAdmin && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-usiu flex items-center p-8 gap-6 transition-all hover:border-accent/40">
              <div className="p-5 bg-accent/20 rounded-2xl">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-[1.5rem] font-black text-primary leading-none">{activeClubs}</h3>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">Active Club Memberships</p>
              </div>
              <Link to="/clubs" className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-usiu-dark-blue transition-all">Explore</Link>
            </div>
          )}


          {/* AI ASSISTANT (All Roles) */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-usiu">
            <div className="px-8 py-6 border-b bg-primary">
              <h3 className="text-white font-bold flex items-center gap-3">
                <Bot className="w-5 h-5 text-accent" /> Omni-Intelligence
              </h3>
            </div>
            <div className="p-8">
              <div className="h-[350px] flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 bg-muted/30 rounded-xl mb-6 space-y-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex items-start gap-3 ${msg.type === "user" ? "justify-end" : ""}`}>
                      {msg.type === "bot" && <Bot className="w-4 h-4 text-primary mt-1 shrink-0" />}
                      <span className={`px-4 py-3 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-sm ${
                        msg.type === "user" ? "bg-primary text-white font-medium" : "bg-card border border-border text-primary"
                      }`}>
                        {msg.text}
                      </span>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-start gap-3">
                      <Bot className="w-4 h-4 text-primary mt-1 shrink-0" />
                      <div className="bg-card border border-border text-primary px-4 py-3 rounded-2xl shadow-sm flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-[10px] font-medium italic">Omni is thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask campus intelligence..."
                    className="flex-1 px-5 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:border-accent"
                  />
                  <button onClick={sendMessage} className="w-[50px] bg-primary text-white rounded-xl hover:bg-usiu-dark-blue transition-all flex items-center justify-center shadow-lg"><Send className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: EVENTS & RESOURCES --- */}
        <div className="space-y-8">
          
          {/* Upcoming Events (Integrated Stats) */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-usiu transition-all hover:border-accent/40">
            <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-primary">
              <h3 className="text-white font-bold flex items-center gap-3">
                <CalendarCheck className="w-5 h-5 text-accent" /> Campus Calendar
              </h3>
              <div className="text-right">
                <p className="text-[10px] text-white/60 font-black uppercase leading-none">Booked</p>
                <p className="text-lg font-black text-accent leading-none">{upcomingEvents}</p>
              </div>
            </div>
            <div className="p-8">

              <div className="space-y-6">
                {events.length === 0 ? (
                  <p className="text-center text-muted-foreground text-xs italic py-8">Quiet days ahead. No upcoming events.</p>
                ) : events.slice(0, 4).map((event: any) => {
                  const dateObj = new Date(event.date);
                  return (
                    <div key={event.id} className="flex items-center gap-5 p-4 border border-border/50 rounded-xl hover:border-accent transition-all group">
                      <div className="bg-primary text-white px-4 py-3 rounded-xl text-center min-w-[70px] group-hover:scale-105 transition-transform">
                        <span className="text-lg font-black block leading-none">{dateObj.getDate()}</span>
                        <span className="text-[9px] font-black uppercase opacity-70 tracking-widest">{dateObj.toLocaleString("default", { month: "short" })}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-primary truncate">{event.title}</h4>
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-tighter truncate">{event.clubs?.name || "Campus"} · {event.location || "TBD"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recommended Books */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-usiu">
            <div className="px-8 py-6 border-b border-border bg-muted/30">
              <h3 className="text-[1.1rem] flex items-center gap-2 text-primary font-bold">
                <Lightbulb className="w-5 h-5 text-accent" /> Curated for You
              </h3>
            </div>
            <div className="p-8 space-y-6">
              {recommendedBooks.length === 0 ? (
                <p className="text-center text-muted-foreground text-xs italic">Check back later for reading list.</p>
              ) : recommendedBooks.map((book: any) => (
                <div key={book.id} className="flex items-center gap-5 p-4 bg-secondary/20 rounded-xl hover:bg-secondary/40 transition-all">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Book className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary leading-tight">{book.title}</h4>
                    <p className="text-muted-foreground text-[10px] font-medium mb-1">{book.author}</p>
                    <span className="text-[#008000] text-[9px] font-black uppercase tracking-widest">Available Now</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

