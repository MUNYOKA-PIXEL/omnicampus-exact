import { useState } from "react";
import { Bot, Send, Loader2, Sparkles, MessageSquare, BookOpen, HeartPulse, Users, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { generateCampusResponse } from "@/services/gemini";
import { useAuth } from "@/contexts/AuthContext";

const AIAssistant = () => {
  const { profile } = useAuth();
  const [chatMessages, setChatMessages] = useState([
    { type: "bot", text: `Hello ${profile?.full_name?.split(" ")[0] || "there"}! I'm Omni-Intelligence. How can I make your campus life easier today?` },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || chatInput;
    if (!messageToSend.trim() || isTyping) return;
    
    setChatInput("");
    setChatMessages((prev) => [...prev, { type: "user", text: messageToSend }]);
    setIsTyping(true);

    try {
      const response = await generateCampusResponse(messageToSend);
      setChatMessages((prev) => [...prev, { type: "bot", text: response }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { type: "bot", text: "I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    { icon: BookOpen, text: "Are there any programming books available?", color: "text-blue-500" },
    { icon: HeartPulse, text: "Which doctors are available today?", color: "text-red-500" },
    { icon: Users, text: "Recommend some active clubs to join", color: "text-green-500" },
    { icon: Search, text: "How do I report a lost item?", color: "text-yellow-500" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[2.5rem] font-bold text-primary flex items-center gap-4">
              <Bot className="w-10 h-10 text-accent" /> Omni-Intelligence
            </h1>
            <p className="text-muted-foreground text-lg">Your intelligent gateway to everything OmniCampus.</p>
          </div>
          <div className="hidden md:flex bg-accent/10 px-4 py-2 rounded-full items-center gap-2 text-accent font-bold text-sm">
            <Sparkles className="w-4 h-4" /> Powered by Gemini 1.5 Flash
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar / Suggestions */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Quick Inquiries
            </h3>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s.text)}
                disabled={isTyping}
                className="w-full text-left p-4 rounded-xl border border-border bg-card hover:border-accent hover:shadow-md transition-all group"
              >
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <p className="text-xs font-medium text-primary group-hover:text-accent transition-colors">{s.text}</p>
              </button>
            ))}
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-usiu flex flex-col h-[600px]">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-4 ${msg.type === "user" ? "justify-end" : ""}`}>
                    {msg.type === "bot" && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg">
                        <Bot className="w-5 h-5 text-accent" />
                      </div>
                    )}
                    <div className={`px-5 py-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${
                      msg.type === "user" 
                        ? "bg-primary text-white font-medium rounded-tr-none" 
                        : "bg-white border border-border text-primary rounded-tl-none"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-accent" />
                    </div>
                    <div className="bg-white border border-border text-primary px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      <span className="text-sm font-medium italic animate-pulse">Consulting campus data...</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t bg-card">
                <div className="flex gap-3 relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask about library, medical, clubs, or events..."
                    className="flex-1 px-6 py-4 bg-secondary/30 border border-border rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!chatInput.trim() || isTyping}
                    className="px-6 bg-primary text-white rounded-2xl hover:bg-usiu-dark-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:-translate-y-0.5"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase tracking-tighter font-medium">
                  Omni-Intelligence may occasionally provide inaccurate info. Cross-check with official departments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIAssistant;
