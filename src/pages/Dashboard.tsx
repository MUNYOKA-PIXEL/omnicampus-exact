import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, Users, AlertTriangle, Clock, CalendarCheck, Bot, Lightbulb, Book, Send } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const Dashboard = () => {
  const [chatMessages, setChatMessages] = useState([
    { type: "bot", text: "Hello! I'm your campus assistant. Ask me about library, clubs, lost items, or medical services!" },
  ]);
  const [chatInput, setChatInput] = useState("");

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { type: "user", text: chatInput },
      { type: "bot", text: "I'm a demo assistant. In the full version, I'd help you with campus queries!" },
    ]);
    setChatInput("");
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-[2.2rem] font-semibold text-primary">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back!</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {[
          { icon: BookOpen, value: "3", label: "Books Borrowed" },
          { icon: Calendar, value: "2", label: "Upcoming Events" },
          { icon: Users, value: "2", label: "Active Clubs" },
          { icon: AlertTriangle, value: "KES 250", label: "Overdue Fines" },
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
                <tr><td className="p-2 border-b border-border">Introduction to Algorithms</td><td className="p-2 border-b border-border">Mar 20, 2025</td><td className="p-2 border-b border-border"><span className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ background: "rgba(0,51,102,0.1)", color: "hsl(210,100%,20%)", borderColor: "hsl(210,100%,20%)" }}>Active</span></td></tr>
                <tr><td className="p-2 border-b border-border">Clean Code</td><td className="p-2 border-b border-border">Mar 25, 2025</td><td className="p-2 border-b border-border"><span className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ background: "rgba(0,51,102,0.1)", color: "hsl(210,100%,20%)", borderColor: "hsl(210,100%,20%)" }}>Active</span></td></tr>
                <tr><td className="p-2 border-b border-border">Database Systems</td><td className="p-2 border-b border-border">Mar 10, 2025</td><td className="p-2 border-b border-border"><span className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ background: "rgba(204,0,0,0.1)", color: "hsl(0,100%,40%)", borderColor: "hsl(0,100%,40%)" }}>Overdue</span></td></tr>
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
              {[
                { date: "Mar 15", title: "Hackathon 2025", detail: "DevClub · Engineering Building" },
                { date: "Mar 20", title: "Pitch Night", detail: "Business Club · Business School" },
              ].map((event) => (
                <div key={event.title} className="flex items-center gap-4">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-center min-w-[70px]">
                    <span className="text-sm font-semibold">{event.date}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{event.title}</h4>
                    <p className="text-muted-foreground text-sm">{event.detail}</p>
                  </div>
                </div>
              ))}
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
            {[
              { title: "The Pragmatic Programmer", author: "David Thomas" },
              { title: "Design Patterns", author: "Erich Gamma" },
              { title: "Python Crash Course", author: "Eric Matthes" },
            ].map((book) => (
              <div key={book.title} className="flex items-center gap-4">
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
