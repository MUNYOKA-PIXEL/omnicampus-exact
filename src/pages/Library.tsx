import { useState } from "react";
import { Plus, Search, BookOpen } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const sampleBooks = [
  { id: 1, title: "Introduction to Algorithms", author: "Thomas H. Cormen", category: "Computer Science", available: true, copies: 3 },
  { id: 2, title: "Clean Code", author: "Robert C. Martin", category: "Programming", available: true, copies: 2 },
  { id: 3, title: "The Lean Startup", author: "Eric Ries", category: "Business", available: false, copies: 0 },
  { id: 4, title: "Design Patterns", author: "Gang of Four", category: "Computer Science", available: true, copies: 1 },
  { id: 5, title: "Database Systems", author: "Ramez Elmasri", category: "Computer Science", available: true, copies: 4 },
  { id: 6, title: "Engineering Mechanics", author: "J.L. Meriam", category: "Engineering", available: true, copies: 2 },
];

const Library = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filteredBooks = sampleBooks.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || book.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-[2.2rem] font-semibold text-primary">Library Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-usiu-dark-blue hover:-translate-y-0.5 transition-all duration-300 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Request Book
        </button>
      </div>

      {/* Search */}
      <div className="mb-8 flex gap-6 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author..."
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-4 bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-accent"
        >
          <option value="">All Categories</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Programming">Programming</option>
          <option value="Business">Business</option>
          <option value="Engineering">Engineering</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b-2 border-primary pb-1">
        {["available", "myLoans", "myRequests"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-[0.95rem] font-medium transition-all duration-300 rounded-t-md ${
              activeTab === tab
                ? "text-primary border-b-[3px] border-accent font-semibold"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            {tab === "available" ? "Available Books" : tab === "myLoans" ? "My Loans" : "My Requests"}
          </button>
        ))}
      </div>

      {/* Available Books */}
      {activeTab === "available" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBooks.map((book) => (
            <div key={book.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-usiu hover:-translate-y-1 hover:shadow-usiu-card hover:border-accent transition-all duration-300">
              <div className="h-40 bg-gradient-to-br from-primary to-usiu-dark-blue flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-accent opacity-80" />
              </div>
              <div className="p-6">
                <h3 className="text-[1.1rem] font-semibold mb-1 text-primary">{book.title}</h3>
                <p className="text-muted-foreground text-sm mb-2">{book.author}</p>
                <span className="text-primary text-xs px-3 py-1 rounded-full inline-block mb-3" style={{ background: "rgba(0,51,102,0.1)" }}>{book.category}</span>
                <span className={`block text-sm mb-4 ${book.available ? "text-[#008000]" : "text-destructive"}`}>
                  {book.available ? `Available (${book.copies} copies)` : "Not Available"}
                </span>
                <button className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-usiu-dark-blue transition-colors duration-300">
                  {book.available ? "Borrow Book" : "Join Waitlist"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Loans */}
      {activeTab === "myLoans" && (
        <div>
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-usiu text-center">
              <h3 className="text-muted-foreground font-medium mb-2">Currently Issued</h3>
              <p className="text-[1.8rem] font-bold text-primary">0</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-usiu text-center">
              <h3 className="text-muted-foreground font-medium mb-2">Total Fines</h3>
              <p className="text-[1.8rem] font-bold text-primary">KES 0</p>
            </div>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider">Book</th>
                <th className="text-left p-4 bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider">Issue Date</th>
                <th className="text-left p-4 bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider">Due Date</th>
                <th className="text-left p-4 bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider">Status</th>
                <th className="text-left p-4 bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider">Fine</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No active loans</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* My Requests */}
      {activeTab === "myRequests" && (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-4 bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider">Book Title</th>
              <th className="text-left p-4 bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider">Author</th>
              <th className="text-left p-4 bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider">Request Date</th>
              <th className="text-left p-4 bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No requests yet</td></tr>
          </tbody>
        </table>
      )}

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-card border border-border rounded-xl w-[90%] max-w-[500px] max-h-[90vh] overflow-y-auto shadow-usiu-card animate-in slide-in-from-top-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-primary text-primary-foreground">
              <h2 className="text-[1.3rem] flex items-center gap-3"><BookOpen className="w-5 h-5 text-accent" /> Request a Book</h2>
              <button onClick={() => setShowModal(false)} className="text-primary-foreground hover:text-accent text-xl">✕</button>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <label className="block mb-2 text-muted-foreground text-sm font-medium">Book Title</label>
                <input className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" placeholder="Enter book title" />
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-muted-foreground text-sm font-medium">Author</label>
                <input className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" placeholder="Enter author name" />
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-muted-foreground text-sm font-medium">Reason</label>
                <textarea className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent min-h-[100px] resize-y" placeholder="Why do you need this book?" />
              </div>
              <button className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-usiu-dark-blue transition-colors duration-300">
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Library;
