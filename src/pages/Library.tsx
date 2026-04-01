import { useState, useEffect } from "react";
import { Plus, Search, BookOpen } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  available: boolean;
  copies: number;
}

interface BookLoan {
  id: string;
  book_id: string;
  issue_date: string;
  due_date: string;
  status: string;
  fine_amount: number | null;
  books?: { title: string };
}

interface BookRequest {
  id: string;
  title: string;
  author: string | null;
  reason: string | null;
  status: string;
  created_at: string;
}

const Library = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<BookLoan[]>([]);
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState<string | null>(null);

  // Request form state
  const [reqTitle, setReqTitle] = useState("");
  const [reqAuthor, setReqAuthor] = useState("");
  const [reqReason, setReqReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [booksRes, loansRes, requestsRes] = await Promise.all([
      supabase.from("books").select("*").order("title"),
      user ? supabase.from("book_loans").select("*, books(title)").eq("user_id", user.id).order("issue_date", { ascending: false }) : Promise.resolve({ data: [] }),
      user ? supabase.from("book_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    ]);
    if (booksRes.data) setBooks(booksRes.data);
    if (loansRes.data) setLoans(loansRes.data as BookLoan[]);
    if (requestsRes.data) setRequests(requestsRes.data as BookRequest[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const categories = [...new Set(books.map(b => b.category))];

  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || book.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleBorrow = async (book: Book) => {
    if (!user || !book.available) return;
    setBorrowing(book.id);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const { error } = await supabase.from("book_loans").insert({
      book_id: book.id,
      user_id: user.id,
      due_date: dueDate.toISOString().split("T")[0],
    });
    setBorrowing(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `"${book.title}" borrowed successfully! Due in 14 days.` });
      fetchData();
    }
  };

  const handleRequestSubmit = async () => {
    if (!user || !reqTitle.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("book_requests").insert({
      title: reqTitle.trim(),
      author: reqAuthor.trim() || null,
      reason: reqReason.trim() || null,
      user_id: user.id,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Book request submitted!" });
      setReqTitle(""); setReqAuthor(""); setReqReason("");
      setShowModal(false);
      fetchData();
    }
  };

  const activeLoans = loans.filter(l => l.status === "active");
  const totalFines = loans.reduce((sum, l) => sum + (l.fine_amount || 0), 0);

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
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
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

      {loading && <div className="text-center text-muted-foreground py-12">Loading...</div>}

      {/* Available Books */}
      {!loading && activeTab === "available" && (
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
                <button
                  onClick={() => handleBorrow(book)}
                  disabled={borrowing === book.id}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-usiu-dark-blue transition-colors duration-300 disabled:opacity-50"
                >
                  {borrowing === book.id ? "Processing..." : book.available ? "Borrow Book" : "Join Waitlist"}
                </button>
              </div>
            </div>
          ))}
          {filteredBooks.length === 0 && <div className="col-span-3 text-center text-muted-foreground py-12">No books found</div>}
        </div>
      )}

      {/* My Loans */}
      {!loading && activeTab === "myLoans" && (
        <div>
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-usiu text-center">
              <h3 className="text-muted-foreground font-medium mb-2">Currently Issued</h3>
              <p className="text-[1.8rem] font-bold text-primary">{activeLoans.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-usiu text-center">
              <h3 className="text-muted-foreground font-medium mb-2">Total Fines</h3>
              <p className="text-[1.8rem] font-bold text-primary">KES {totalFines}</p>
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
              {loans.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No active loans</td></tr>
              ) : loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-primary/5">
                  <td className="p-4 border-b border-border">{(loan as any).books?.title || "Unknown"}</td>
                  <td className="p-4 border-b border-border">{new Date(loan.issue_date).toLocaleDateString()}</td>
                  <td className="p-4 border-b border-border">{new Date(loan.due_date).toLocaleDateString()}</td>
                  <td className="p-4 border-b border-border">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${loan.status === "active" ? "bg-primary/10 text-primary" : "bg-[#008000]/10 text-[#008000]"}`}>
                      {loan.status === "active" && new Date(loan.due_date) < new Date() ? "Overdue" : loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4 border-b border-border">KES {loan.fine_amount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* My Requests */}
      {!loading && activeTab === "myRequests" && (
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
            {requests.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No requests yet</td></tr>
            ) : requests.map((req) => (
              <tr key={req.id} className="hover:bg-primary/5">
                <td className="p-4 border-b border-border">{req.title}</td>
                <td className="p-4 border-b border-border">{req.author || "N/A"}</td>
                <td className="p-4 border-b border-border">{new Date(req.created_at).toLocaleDateString()}</td>
                <td className="p-4 border-b border-border">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    req.status === "approved" ? "bg-[#008000]/10 text-[#008000]" : req.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-accent/20 text-primary"
                  }`}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span>
                </td>
              </tr>
            ))}
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
                <input value={reqTitle} onChange={e => setReqTitle(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" placeholder="Enter book title" />
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-muted-foreground text-sm font-medium">Author</label>
                <input value={reqAuthor} onChange={e => setReqAuthor(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" placeholder="Enter author name" />
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-muted-foreground text-sm font-medium">Reason</label>
                <textarea value={reqReason} onChange={e => setReqReason(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent min-h-[100px] resize-y" placeholder="Why do you need this book?" />
              </div>
              <button
                onClick={handleRequestSubmit}
                disabled={submitting || !reqTitle.trim()}
                className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-usiu-dark-blue transition-colors duration-300 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Library;
