import { useState, useEffect } from "react";
import { Plus, Search, BookOpen, Trash2, Edit, Check, X, Download, FilePlus } from "lucide-react";
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
  user_id: string;
  issue_date: string;
  due_date: string;
  status: string;
  fine_amount: number | null;
  books?: { title: string };
  profiles?: { full_name: string; student_id: string };
}

interface BookRequest {
  id: string;
  title: string;
  author: string | null;
  reason: string | null;
  status: string;
  created_at: string;
  profiles?: { full_name: string; student_id: string };
}

interface Resource {
  id: string;
  title: string;
  file_url: string | null;
  category: string;
  created_at: string;
}

const Library = () => {
  const { user, role } = useAuth();
  const isAdmin = role === "libadmin" || role === "superadmin";
  
  const [activeTab, setActiveTab] = useState("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<BookLoan[]>([]);
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [reqTitle, setReqTitle] = useState("");
  const [reqAuthor, setReqAuthor] = useState("");
  const [reqReason, setReqReason] = useState("");
  
  const [newBook, setNewBook] = useState({ title: "", author: "", category: "", copies: 1 });
  const [newResource, setNewResource] = useState({ title: "", file_url: "" });
  
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const promises = [
      supabase.from("books").select("*").order("title"),
      isAdmin 
        ? supabase.from("book_loans").select("*, books(title), profiles(full_name, student_id)").order("issue_date", { ascending: false })
        : (user ? supabase.from("book_loans").select("*, books(title)").eq("user_id", user.id).order("issue_date", { ascending: false }) : Promise.resolve({ data: [] })),
      isAdmin
        ? supabase.from("book_requests").select("*, profiles(full_name, student_id)").order("created_at", { ascending: false })
        : (user ? supabase.from("book_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] })),
      supabase.from("resources").select("*").eq("category", "library").order("created_at", { ascending: false }),
    ];

    const [booksRes, loansRes, requestsRes, resourcesRes] = await Promise.all(promises);
    
    if (booksRes.data) setBooks(booksRes.data);
    if (loansRes.data) setLoans(loansRes.data as BookLoan[]);
    if (requestsRes.data) setRequests(requestsRes.data as BookRequest[]);
    if (resourcesRes.data) setResources(resourcesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, role]);

  const categories = [...new Set(books.map(b => b.category))];

  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || book.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleBorrow = async (book: Book) => {
    if (!user || !book.available) return;
    setActionLoading(book.id);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const { error } = await supabase.from("book_loans").insert({
      book_id: book.id,
      user_id: user.id,
      due_date: dueDate.toISOString().split("T")[0],
    });
    setActionLoading(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `"${book.title}" borrowed successfully!` });
      fetchData();
    }
  };

  // ADMIN ACTIONS
  const handleAddBook = async () => {
    if (!newBook.title || !newBook.author) return;
    setSubmitting(true);
    const { error } = await supabase.from("books").insert([newBook]);
    setSubmitting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Book Added", description: `${newBook.title} is now in inventory.` });
      setShowBookModal(false);
      setNewBook({ title: "", author: "", category: "", copies: 1 });
      fetchData();
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Book Deleted" }); fetchData(); }
  };

  const handleReturnLoan = async (loanId: string) => {
    const { error } = await supabase.from("book_loans").update({ 
      status: "returned", 
      returned_at: new Date().toISOString().split("T")[0] 
    }).eq("id", loanId);
    
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Book Returned" }); fetchData(); }
  };

  const handleUpdateRequest = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("book_requests").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Request ${status}` }); fetchData(); }
  };

  const handleAddResource = async () => {
    if (!user || !newResource.title) return;
    setSubmitting(true);
    const { error } = await supabase.from("resources").insert([{
      ...newResource,
      category: "library",
      uploaded_by: user.id
    }]);
    setSubmitting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Resource Added" });
      setShowResourceModal(false);
      setNewResource({ title: "", file_url: "" });
      fetchData();
    }
  };

  const handleRequestSubmit = async () => {
    if (!user || !reqTitle.trim()) return;
    
    setSubmitting(true);
    // Explicitly use user.id to match RLS auth.uid() check
    const { error } = await supabase.from("book_requests").insert({
      title: reqTitle.trim(),
      author: reqAuthor.trim() || null,
      reason: reqReason.trim() || null,
      user_id: user.id,
      status: 'pending'
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

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-[2.2rem] font-semibold text-primary">Library {isAdmin ? "Admin" : "Management"}</h1>
          <p className="text-muted-foreground">{isAdmin ? "Manage campus inventory and circulation" : "Browse and borrow campus books"}</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowBookModal(true)}
                className="bg-accent text-primary px-6 py-3 rounded-md font-bold hover:scale-105 transition-all inline-flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" /> Add New Book
              </button>
              <button
                onClick={() => setShowResourceModal(true)}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-usiu-dark-blue transition-all inline-flex items-center gap-2 shadow-lg"
              >
                <FilePlus className="w-4 h-4" /> Add Resource
              </button>
            </>
          )}
          {!isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-usiu-dark-blue transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Request Book
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
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
      <div className="flex gap-1 mb-8 border-b-2 border-primary pb-1 overflow-x-auto">
        {[
          { id: "available", label: isAdmin ? "Inventory" : "Available Books" },
          { id: "loans", label: isAdmin ? "Active Loans" : "My Loans" },
          { id: "requests", label: isAdmin ? "Acquisition Requests" : "My Requests" },
          { id: "resources", label: "Digital Resources" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-[0.95rem] font-medium transition-all duration-300 rounded-t-md whitespace-nowrap ${
              activeTab === tab.id
                ? "text-primary border-b-[3px] border-accent font-bold"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center text-muted-foreground py-12">Loading Library Data...</div>}

      {/* 1. Inventory / Available Books */}
      {!loading && activeTab === "available" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBooks.map((book) => (
            <div key={book.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-usiu hover:border-accent transition-all duration-300">
              <div className="h-40 bg-gradient-to-br from-primary to-usiu-dark-blue flex items-center justify-center relative">
                <BookOpen className="w-16 h-16 text-accent opacity-80" />
                {isAdmin && (
                  <button 
                    onClick={() => handleDeleteBook(book.id)}
                    className="absolute top-4 right-4 p-2 bg-destructive/20 text-destructive rounded-full hover:bg-destructive hover:text-white transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-[1.1rem] font-bold mb-1 text-primary">{book.title}</h3>
                <p className="text-muted-foreground text-sm mb-2">By {book.author}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-primary text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "rgba(0,51,102,0.1)" }}>{book.category}</span>
                  <span className={`text-sm font-bold ${book.available ? "text-[#008000]" : "text-destructive"}`}>
                    {book.available ? `${book.copies} Copies` : "Out of Stock"}
                  </span>
                </div>
                {!isAdmin && (
                  <button
                    onClick={() => handleBorrow(book)}
                    disabled={actionLoading === book.id || !book.available}
                    className="w-full mt-6 py-3 bg-primary text-primary-foreground rounded-md font-bold hover:bg-usiu-dark-blue transition-all disabled:opacity-50"
                  >
                    {actionLoading === book.id ? "Processing..." : book.available ? "Borrow This Book" : "Not Available"}
                  </button>
                )}
                {isAdmin && (
                  <div className="grid grid-cols-2 gap-2 mt-6">
                    <button className="py-2 border border-primary text-primary rounded-md text-sm font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                    <button className="py-2 bg-primary text-white rounded-md text-sm font-bold hover:bg-usiu-dark-blue transition-all">
                      Restock
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Loans Management */}
      {!loading && activeTab === "loans" && (
        <div className="bg-card border border-border rounded-xl shadow-usiu overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="text-left p-4 text-xs font-bold uppercase">Book Title</th>
                <th className="text-left p-4 text-xs font-bold uppercase">{isAdmin ? "Student" : "Issue Date"}</th>
                <th className="text-left p-4 text-xs font-bold uppercase">Due Date</th>
                <th className="text-left p-4 text-xs font-bold uppercase">Status</th>
                <th className="text-center p-4 text-xs font-bold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No active circulation records found.</td></tr>
              ) : loans.map((loan) => {
                const isOverdue = new Date(loan.due_date) < new Date() && loan.status === "active";
                return (
                  <tr key={loan.id} className="border-b border-border hover:bg-primary/5 transition-colors">
                    <td className="p-4 font-semibold text-primary">{loan.books?.title}</td>
                    <td className="p-4 text-sm">
                      {isAdmin ? (
                        <div>
                          <p className="font-bold">{loan.profiles?.full_name}</p>
                          <p className="text-xs text-muted-foreground">ID: {loan.profiles?.student_id}</p>
                        </div>
                      ) : new Date(loan.issue_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm font-medium">{new Date(loan.due_date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        loan.status === "returned" ? "bg-[#008000]/10 text-[#008000]" : 
                        isOverdue ? "bg-destructive text-white" : "bg-accent/20 text-primary"
                      }`}>
                        {isOverdue ? "Overdue" : loan.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {isAdmin && loan.status === "active" && (
                        <button 
                          onClick={() => handleReturnLoan(loan.id)}
                          className="text-xs bg-[#008000] text-white px-4 py-2 rounded font-bold hover:scale-105 transition-all inline-flex items-center gap-2"
                        >
                          <Check className="w-3 h-3" /> Mark Returned
                        </button>
                      )}
                      {!isAdmin && loan.status === "active" && (
                        <span className="text-xs text-muted-foreground italic">Contact library to return</span>
                      )}
                      {loan.status === "returned" && <span className="text-xs font-bold text-[#008000]">✓ Closed</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Requests Management */}
      {!loading && activeTab === "requests" && (
        <div className="bg-card border border-border rounded-xl shadow-usiu overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="text-left p-4 text-xs font-bold uppercase">Requested Book</th>
                <th className="text-left p-4 text-xs font-bold uppercase">{isAdmin ? "Student" : "Author"}</th>
                <th className="text-left p-4 text-xs font-bold uppercase">Date</th>
                <th className="text-left p-4 text-xs font-bold uppercase">Status</th>
                {isAdmin && <th className="text-center p-4 text-xs font-bold uppercase">Decision</th>}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={isAdmin ? 5 : 4} className="p-12 text-center text-muted-foreground">No book requests found.</td></tr>
              ) : requests.map((req) => (
                <tr key={req.id} className="border-b border-border hover:bg-primary/5 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-primary">{req.title}</p>
                    {isAdmin && <p className="text-xs text-muted-foreground italic mt-1">"{req.reason}"</p>}
                  </td>
                  <td className="p-4 text-sm">
                    {isAdmin ? (
                      <div>
                        <p className="font-bold">{req.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground">ID: {req.profiles?.student_id}</p>
                      </div>
                    ) : (req.author || "N/A")}
                  </td>
                  <td className="p-4 text-sm">{new Date(req.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      req.status === "approved" ? "bg-[#008000]/10 text-[#008000]" : 
                      req.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-accent/20 text-primary"
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="p-4 text-center">
                      {req.status === "pending" ? (
                        <div className="flex gap-2 justify-center">
                          <button 
                            onClick={() => handleUpdateRequest(req.id, "approved")}
                            className="p-2 bg-[#008000] text-white rounded hover:bg-green-700" title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdateRequest(req.id, "rejected")}
                            className="p-2 bg-destructive text-white rounded hover:bg-red-700" title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : <span className="text-xs text-muted-foreground font-medium">Processed</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Resources */}
      {!loading && activeTab === "resources" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.length === 0 ? (
            <div className="col-span-3 text-center text-muted-foreground py-12">No library resources available.</div>
          ) : resources.map((res) => (
            <div key={res.id} className="bg-card border border-border rounded-xl p-6 shadow-usiu hover:border-accent transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[0.7rem] text-muted-foreground font-bold">{new Date(res.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-bold text-primary mb-4">{res.title}</h3>
              {res.file_url ? (
                <a
                  href={res.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-secondary text-primary rounded-md font-bold text-sm inline-flex items-center justify-center gap-2 hover:bg-accent transition-all"
                >
                  <Download className="w-4 h-4" /> Download Guide
                </a>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center">No file attached</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Admin: Add Book Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center">
          <div className="bg-card w-[95%] max-w-[500px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2"><Plus className="text-accent" /> Add New Inventory</h2>
              <button onClick={() => setShowBookModal(false)} className="hover:text-accent transition-colors"><X /></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Book Title</label>
                <input 
                  value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})}
                  className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg focus:outline-none focus:border-accent" 
                  placeholder="e.g. Advanced Database Systems" 
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Author Name</label>
                <input 
                  value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})}
                  className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg focus:outline-none focus:border-accent" 
                  placeholder="e.g. Dr. Jane Smith" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Category</label>
                  <input 
                    value={newBook.category} onChange={e => setNewBook({...newBook, category: e.target.value})}
                    className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg focus:outline-none focus:border-accent" 
                    placeholder="e.g. CS" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Total Copies</label>
                  <input 
                    type="number" value={newBook.copies} onChange={e => setNewBook({...newBook, copies: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg focus:outline-none focus:border-accent" 
                  />
                </div>
              </div>
              <button
                onClick={handleAddBook}
                disabled={submitting || !newBook.title}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-usiu-dark-blue transition-all disabled:opacity-50 shadow-lg"
              >
                {submitting ? "Processing..." : "Confirm & Add Book"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin: Add Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center">
          <div className="bg-card w-[95%] max-w-[450px] rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2"><FilePlus className="text-accent" /> New Digital Resource</h2>
              <button onClick={() => setShowResourceModal(false)}><X /></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Resource Title</label>
                <input 
                  value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})}
                  className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg" 
                  placeholder="e.g. Exam Revision Guide 2026" 
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">External URL / File Link</label>
                <input 
                  value={newResource.file_url} onChange={e => setNewResource({...newResource, file_url: e.target.value})}
                  className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg" 
                  placeholder="https://..." 
                />
              </div>
              <button
                onClick={handleAddResource}
                disabled={submitting || !newResource.title}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-usiu-dark-blue transition-all shadow-lg"
              >
                {submitting ? "Publishing..." : "Upload Resource"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student: Request Book Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-card border border-border rounded-xl w-[90%] max-w-[500px] max-h-[90vh] overflow-y-auto shadow-usiu-card animate-in slide-in-from-top-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-primary text-primary-foreground">
              <h2 className="text-[1.3rem] flex items-center gap-3"><BookOpen className="w-5 h-5 text-accent" /> Request a Book</h2>
              <button onClick={() => setShowModal(false)} className="text-primary-foreground hover:text-accent text-xl">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block mb-2 text-muted-foreground text-sm font-medium">Book Title</label>
                <input value={reqTitle} onChange={e => setReqTitle(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" placeholder="Enter book title" />
              </div>
              <div>
                <label className="block mb-2 text-muted-foreground text-sm font-medium">Author (Optional)</label>
                <input value={reqAuthor} onChange={e => setReqAuthor(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" placeholder="Enter author name" />
              </div>
              <div>
                <label className="block mb-2 text-muted-foreground text-sm font-medium">Reason for Request</label>
                <textarea value={reqReason} onChange={e => setReqReason(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent min-h-[100px] resize-y" placeholder="Why should the library acquire this book?" />
              </div>
              <button
                onClick={handleRequestSubmit}
                disabled={submitting || !reqTitle.trim()}
                className="w-full py-4 bg-primary text-primary-foreground rounded-md font-bold hover:bg-usiu-dark-blue transition-all disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Acquisition Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Library;

