import { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Check, Handshake, Percent, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const sampleItems = [
  { id: 1, type: "Lost", item: "Student ID Card", description: "Blue USIU student ID", location: "Library 2nd Floor", date: "Mar 10, 2025", status: "Searching" },
  { id: 2, type: "Found", item: "Water Bottle", description: "Green Hydro Flask", location: "Cafeteria", date: "Mar 11, 2025", status: "Unclaimed" },
  { id: 3, type: "Lost", item: "Laptop Charger", description: "Dell 65W charger", location: "Engineering Lab", date: "Mar 9, 2025", status: "Matched" },
];

const LostFound = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLostModal, setShowLostModal] = useState(false);
  const [showFoundModal, setShowFoundModal] = useState(false);

  const tabs = [
    { id: "all", label: "All Items" },
    { id: "lost", label: "Lost Items" },
    { id: "found", label: "Found Items" },
    { id: "matches", label: "Potential Matches" },
    { id: "my", label: "My Reports" },
  ];

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
          { icon: Clock, value: "2", label: "Lost Items" },
          { icon: Check, value: "1", label: "Found Items" },
          { icon: Handshake, value: "1", label: "Potential Matches" },
          { icon: Percent, value: "75%", label: "Recovery Rate" },
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

      {/* All Items Table */}
      {activeTab === "all" && (
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
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Type", "Item", "Description", "Location", "Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left p-4 bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleItems
                .filter((item) => item.item.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5">
                    <td className="p-4 border-b border-border">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.type === "Lost" ? "bg-destructive/10 text-destructive" : "bg-[#008000]/10 text-[#008000]"}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 border-b border-border">{item.item}</td>
                    <td className="p-4 border-b border-border">{item.description}</td>
                    <td className="p-4 border-b border-border">{item.location}</td>
                    <td className="p-4 border-b border-border">{item.date}</td>
                    <td className="p-4 border-b border-border">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(255,215,0,0.2)", color: "#856404", border: "1px solid hsl(51,100%,50%)" }}>{item.status}</span>
                    </td>
                    <td className="p-4 border-b border-border">
                      <button className="text-primary text-sm font-medium hover:text-accent">View</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "lost" && <div className="text-center text-muted-foreground py-12">No lost items to display</div>}
      {activeTab === "found" && <div className="text-center text-muted-foreground py-12">No found items to display</div>}
      {activeTab === "matches" && <div className="text-center text-muted-foreground py-12">No matches to display</div>}
      {activeTab === "my" && <div className="text-center text-muted-foreground py-12">No reports to display</div>}

      {/* Report Lost Modal */}
      {showLostModal && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center" onClick={() => setShowLostModal(false)}>
          <div className="bg-card border border-border rounded-xl w-[90%] max-w-[500px] max-h-[90vh] overflow-y-auto shadow-usiu-card" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-6 border-b flex justify-between items-center bg-primary text-primary-foreground">
              <h2 className="text-[1.3rem] flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-accent" /> Report Lost Item</h2>
              <button onClick={() => setShowLostModal(false)} className="text-primary-foreground hover:text-accent text-xl">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Item Name</label><input className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" placeholder="What did you lose?" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Description</label><textarea className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent min-h-[100px] resize-y" placeholder="Describe the item" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Last Seen Location</label><input className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" placeholder="Where did you last see it?" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Date Lost</label><input type="date" className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" /></div>
              <button className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-usiu-dark-blue transition-colors duration-300">Submit Report</button>
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
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Item Name</label><input className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" placeholder="What did you find?" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Description</label><textarea className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent min-h-[100px] resize-y" placeholder="Describe the item" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Found Location</label><input className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" placeholder="Where did you find it?" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Date Found</label><input type="date" className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" /></div>
              <button className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-usiu-dark-blue transition-colors duration-300">Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LostFound;
