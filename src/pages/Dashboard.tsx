import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, Users, AlertTriangle, Clock, CalendarCheck, Bot, Lightbulb, Book, Send } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [chatMessages, setChatMessages] = useState([
    { type: "bot", text: "Hello! I'm your campus assistant. Ask me about library, clubs, lost items, or medical services!" },
  ]);
  const [chatInput, setChatInput] = useState("");

  // Live stats
  const [booksBorrowed, setBooksBorrowed] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [activeClubs, setActiveClubs] = useState(0);
  const [overdueFines, setOverdueFines] = useState(0);
  const [loans, setLoans] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchDashboard = async () => {
      const [loansRes, membershipsRes, eventsRes, booksRes] = await Promise.all([
        supabase.from("book_loans").select("*, books(title)").eq("user_id", user.id).order("issue_date", { ascending: false }).limit(5),
        supabase.from("club_memberships").select("club_id").eq("user_id", user.id),
        supabase.from("club_events").select("*, clubs(name)").gte("date", new Date().toISOString().split("T")[0]).order("date").limit(5),
        supabase.from("books").select("*").eq("available", true).limit(3),
      ]);

      const userLoans = loansRes.data || [];
      setLoans(userLoans);
      const activeLoans = userLoans.filter((l: any) => l.status === "active");
      setBooksBorrowed(activeLoans.length);
      setOverdueFines(userLoans.reduce((sum: number, l: any) => sum + (l.fine_amount || 0), 0));

      setActiveClubs((membershipsRes.data || []).length);
      setEvents(eventsRes.data || []);
      setUpcomingEvents((eventsRes.data || []).length);
      setRecommendedBooks(booksRes.data || []);
    };
    fetchDashboard();
  }, [user]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const input = chatInput.toLowerCase();
    let response = "I can help with library, clubs, lost items, and medical services. Try asking about those!";
    if (input.includes("library") || input.includes("book")) response = "Visit the Library page to browse books, check your loans, or request new books.";
    else if (input.includes("club")) response = "Check out the Clubs page to join student clubs and RSVP to events!";
    else if (input.includes("lost") || input.includes("found")) response = "Go to Lost & Found to report lost or found items on campus.";
    else if (input.includes("medical") || input.includes("doctor") || input.includes("appointment")) response = "Visit Medical Services to book appointments and view available doctors.";
    else if (input.includes("hello") || input.includes("hi")) response = `Hi ${profile?.full_name || "there"}! How can I help you today?`;
    else if (input.includes("how many clubs") || input.includes("clubs count")) response = `There are currently ${activeClubs} clubs you are a member of, but many more to join!`;
    else if (input.includes("how many books") || input.includes("books count")) response = `You have ${booksBorrowed} books currently borrowed.`;

    setChatMessages((prev) => [
      ...prev,
      { type: "user", text: chatInput },
      { type: "bot", text: response },
    ]);
    setChatInput("");
  };


  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-[2.2rem] font-semibold text-primary">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}!</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {[
          { icon: BookOpen, value: String(booksBorrowed), label: "Books Borrowed" },
          { icon: Calendar, value: String(upcomingEvents), label: "Upcoming Events" },
          { icon: Users, value: String(activeClubs), label: "Active Clubs" },
          { icon: AlertTriangle, value: `KES ${overdueFines}`, label: "Overdue Fines" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-8 flex items-center gap-6 shadow-usiu">
              <div className="p-4 rounded-md" style={{ background: "rgba(0,51,102,0.1)" }}>
                <Icon className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-[1.8rem] font-bold text-primary">{stat.value}</h3>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-2 gap-8 mt-8">
        {/* Current Loans */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-usiu">
          <div className="px-8 py-6 border-b border-border flex justify-between items-center" style={{ background: "rgba(0,51,102,0.05)" }}>
            <h3 className="text-[1.1rem] flex items-center gap-2 text-primary">
              <Clock className="w-5 h-5 text-accent" /> Current Loans
            </h3>
            <Link to="/library" className="text-primary text-sm">View All</Link>
          </div>
          <div className="p-8">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Book</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Due Date</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.filter(l => l.status === "active").length === 0 ? (
                  <tr><td colSpan={3} className="p-2 text-center text-muted-foreground text-sm">No active loans</td></tr>
                ) : loans.filter(l => l.status === "active").map((loan: any) => {
                  const isOverdue = new Date(loan.due_date) < new Date();
                  return (
                    <tr key={loan.id}>
                      <td className="p-2 border-b border-border">{loan.books?.title || "Unknown"}</td>
                      <td className="p-2 border-b border-border">{new Date(loan.due_date).toLocaleDateString()}</td>
                      <td className="p-2 border-b border-border">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold border" style={isOverdue ? { background: "rgba(204,0,0,0.1)", color: "hsl(0,100%,40%)", borderColor: "hsl(0,100%,40%)" } : { background: "rgba(0,51,102,0.1)", color: "hsl(210,100%,20%)", borderColor: "hsl(210,100%,20%)" }}>
                          {isOverdue ? "Overdue" : "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-usiu">
          <div className="px-8 py-6 border-b border-border flex justify-between items-center" style={{ background: "rgba(0,51,102,0.05)" }}>
            <h3 className="text-[1.1rem] flex items-center gap-2 text-primary">
              <CalendarCheck className="w-5 h-5 text-accent" /> Upcoming Events
            </h3>
            <Link to="/clubs" className="text-primary text-sm">View All</Link>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm">No upcoming events</p>
              ) : events.slice(0, 3).map((event: any) => {
                const dateObj = new Date(event.date);
                return (
                  <div key={event.id} className="flex items-center gap-4">
                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-center min-w-[70px]">
                      <span className="text-sm font-semibold">{dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{event.title}</h4>
                      <p className="text-muted-foreground text-sm">{event.clubs?.name || "Club"} · {event.location || "TBD"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-usiu">
          <div className="px-8 py-6 border-b border-border" style={{ background: "rgba(0,51,102,0.05)" }}>
            <h3 className="text-[1.1rem] flex items-center gap-2 text-primary">
              <Bot className="w-5 h-5 text-accent" /> AI Assistant
            </h3>
          </div>
          <div className="p-8">
            <div className="h-[400px] flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 bg-background rounded-md mb-6 space-y-6">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-3 ${msg.type === "user" ? "justify-end" : ""}`}>
                    {msg.type === "bot" && <Bot className="w-5 h-5 text-primary mt-1" />}
                    <span
                      className={`px-4 py-3 rounded-xl max-w-[80%] leading-relaxed border ${
                        msg.type === "user"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border"
                      }`}
                    >
                      {msg.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-accent"
                />
                <button
                  onClick={sendMessage}
                  className="w-[50px] bg-primary text-primary-foreground rounded-md hover:bg-usiu-dark-blue transition-colors duration-300 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Books */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-usiu">
          <div className="px-8 py-6 border-b border-border" style={{ background: "rgba(0,51,102,0.05)" }}>
            <h3 className="text-[1.1rem] flex items-center gap-2 text-primary">
              <Lightbulb className="w-5 h-5 text-accent" /> Recommended Books
            </h3>
          </div>
          <div className="p-8 space-y-6">
            {recommendedBooks.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm">No recommendations available</p>
            ) : recommendedBooks.map((book: any) => (
              <div key={book.id} className="flex items-center gap-4">
                <Book className="w-8 h-8 text-primary" />
                <div>
                  <h4 className="font-semibold text-foreground">{book.title}</h4>
                  <p className="text-muted-foreground text-sm">{book.author}</p>
                  <span className="text-[#008000] text-sm">Available</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
