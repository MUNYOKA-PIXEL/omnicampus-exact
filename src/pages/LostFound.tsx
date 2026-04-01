import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Clock, Check, Handshake, Percent, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface LostFoundItem {
  id: string;
  type: string;
  item_name: string;
  description: string | null;
  location: string | null;
  date_reported: string;
  status: string;
  user_id: string;
}

const LostFound = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLostModal, setShowLostModal] = useState(false);
  const [showFoundModal, setShowFoundModal] = useState(false);
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemLocation, setItemLocation] = useState("");
  const [itemDate, setItemDate] = useState("");

  const tabs = [
    { id: "all", label: "All Items" },
    { id: "lost", label: "Lost Items" },
    { id: "found", label: "Found Items" },
    { id: "matches", label: "Potential Matches" },
    { id: "my", label: "My Reports" },
  ];

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from("lost_found_items").select("*").order("date_reported", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmitReport = async (type: "Lost" | "Found") => {
    if (!user || !itemName.trim()) {
      toast({ title: "Error", description: "Item name is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("lost_found_items").insert({
      type,
      item_name: itemName.trim(),
      description: itemDesc.trim() || null,
      location: itemLocation.trim() || null,
      date_reported: itemDate || new Date().toISOString().split("T")[0],
      user_id: user.id,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${type} item report submitted!` });
      setItemName(""); setItemDesc(""); setItemLocation(""); setItemDate("");
      setShowLostModal(false); setShowFoundModal(false);
      fetchItems();
    }
  };

  const getFilteredItems = () => {
    let filtered = items;
    if (activeTab === "lost") filtered = items.filter(i => i.type === "Lost");
    else if (activeTab === "found") filtered = items.filter(i => i.type === "Found");
    else if (activeTab === "matches") filtered = items.filter(i => i.status === "matched");
    else if (activeTab === "my") filtered = items.filter(i => i.user_id === user?.id);

    if (searchQuery) {
      filtered = filtered.filter(i => i.item_name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  };

  const filteredItems = getFilteredItems();
  const lostCount = items.filter(i => i.type === "Lost").length;
  const foundCount = items.filter(i => i.type === "Found").length;
  const matchedCount = items.filter(i => i.status === "matched").length;
  const recoveryRate = items.length > 0 ? Math.round((matchedCount / items.length) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-[2.2rem] font-semibold text-primary">Lost & Found System</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowLostModal(true)}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-usiu-dark-blue transition-all duration-300 inline-flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" /> Report Lost
          </button>
          <button
            onClick={() => setShowFoundModal(true)}
            className="bg-transparent text-primary border border-primary px-6 py-3 rounded-md font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300 inline-flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Report Found
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {[
          { icon: Clock, value: String(lostCount), label: "Lost Items" },
          { icon: Check, value: String(foundCount), label: "Found Items" },
          { icon: Handshake, value: String(matchedCount), label: "Potential Matches" },
          { icon: Percent, value: `${recoveryRate}%`, label: "Recovery Rate" },
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

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b-2 border-primary pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-[0.95rem] font-medium transition-all duration-300 rounded-t-md ${
              activeTab === tab.id
                ? "text-primary border-b-[3px] border-accent font-semibold"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center text-muted-foreground py-12">Loading...</div>}

      {/* Items Table */}
      {!loading && (
        <div>
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          {filteredItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">No items to display</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Type", "Item", "Description", "Location", "Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left p-4 bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5">
                    <td className="p-4 border-b border-border">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.type === "Lost" ? "bg-destructive/10 text-destructive" : "bg-[#008000]/10 text-[#008000]"}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 border-b border-border">{item.item_name}</td>
                    <td className="p-4 border-b border-border">{item.description || "N/A"}</td>
                    <td className="p-4 border-b border-border">{item.location || "N/A"}</td>
                    <td className="p-4 border-b border-border">{new Date(item.date_reported).toLocaleDateString()}</td>
                    <td className="p-4 border-b border-border">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(255,215,0,0.2)", color: "#856404", border: "1px solid hsl(51,100%,50%)" }}>{item.status}</span>
                    </td>
                    <td className="p-4 border-b border-border">
                      <button
                        onClick={() => toast({ title: item.item_name, description: `${item.type} at ${item.location || "unknown location"}. Status: ${item.status}` })}
                        className="text-primary text-sm font-medium hover:text-accent"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Report Lost Modal */}
      {showLostModal && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center" onClick={() => setShowLostModal(false)}>
          <div className="bg-card border border-border rounded-xl w-[90%] max-w-[500px] max-h-[90vh] overflow-y-auto shadow-usiu-card" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-6 border-b flex justify-between items-center bg-primary text-primary-foreground">
              <h2 className="text-[1.3rem] flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-accent" /> Report Lost Item</h2>
              <button onClick={() => setShowLostModal(false)} className="text-primary-foreground hover:text-accent text-xl">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Item Name</label><input value={itemName} onChange={e => setItemName(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" placeholder="What did you lose?" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Description</label><textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent min-h-[100px] resize-y" placeholder="Describe the item" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Last Seen Location</label><input value={itemLocation} onChange={e => setItemLocation(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" placeholder="Where did you last see it?" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Date Lost</label><input type="date" value={itemDate} onChange={e => setItemDate(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" /></div>
              <button onClick={() => handleSubmitReport("Lost")} disabled={submitting} className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-usiu-dark-blue transition-colors duration-300 disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Found Modal */}
      {showFoundModal && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center" onClick={() => setShowFoundModal(false)}>
          <div className="bg-card border border-border rounded-xl w-[90%] max-w-[500px] max-h-[90vh] overflow-y-auto shadow-usiu-card" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-6 border-b flex justify-between items-center bg-primary text-primary-foreground">
              <h2 className="text-[1.3rem] flex items-center gap-3"><CheckCircle className="w-5 h-5 text-accent" /> Report Found Item</h2>
              <button onClick={() => setShowFoundModal(false)} className="text-primary-foreground hover:text-accent text-xl">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Item Name</label><input value={itemName} onChange={e => setItemName(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" placeholder="What did you find?" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Description</label><textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent min-h-[100px] resize-y" placeholder="Describe the item" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Found Location</label><input value={itemLocation} onChange={e => setItemLocation(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" placeholder="Where did you find it?" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Date Found</label><input type="date" value={itemDate} onChange={e => setItemDate(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" /></div>
              <button onClick={() => handleSubmitReport("Found")} disabled={submitting} className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-usiu-dark-blue transition-colors duration-300 disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LostFound;
