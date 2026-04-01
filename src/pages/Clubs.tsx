import { useState, useEffect } from "react";
import { Users, Calendar, DollarSign, Plus, Trash2, Check, X, FilePlus, ExternalLink, Edit } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Club {
  id: string;
  name: string;
  description: string | null;
  dues: string | null;
  icon: string | null;
  meeting_day: string | null;
  member_count?: number;
}

interface ClubEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  club_id: string;
  clubs?: { name: string };
}

interface Resource {
  id: string;
  title: string;
  file_url: string | null;
  category: string;
  created_at: string;
}

const Clubs = () => {
  const { user, role } = useAuth();
  const isAdmin = role === "clubadmin" || role === "superadmin";
  
  const [activeTab, setActiveTab] = useState("all-clubs");
  const [showClubModal, setShowClubModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [myClubIds, setMyClubIds] = useState<string[]>([]);
  const [myRsvpIds, setMyRsvpIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [newClub, setNewClub] = useState({ name: "", description: "", dues: "Free", meeting_day: "TBD", icon: "🎯" });
  const [newEvent, setNewEvent] = useState({ title: "", description: "", date: "", time: "", location: "", club_id: "" });
  const [newResource, setNewResource] = useState({ title: "", file_url: "" });

  const fetchData = async () => {
    setLoading(true);
    const promises = [
      supabase.from("clubs").select("*").order("name"),
      supabase.from("club_events").select("*, clubs(name)").order("date"),
      user ? supabase.from("club_memberships").select("club_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
      user ? supabase.from("event_rsvps").select("event_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
      supabase.from("club_memberships").select("club_id"),
      supabase.from("resources").select("*").eq("category", "club").order("created_at", { ascending: false }),
    ];

    const [clubsRes, eventsRes, membershipsRes, rsvpsRes, countsRes, resourcesRes] = await Promise.all(promises);

    // Count members per club
    const countMap: Record<string, number> = {};
    ((countsRes as any).data || []).forEach((m: any) => { countMap[m.club_id] = (countMap[m.club_id] || 0) + 1; });

    if (clubsRes.data) setClubs(clubsRes.data.map((c: any) => ({ ...c, member_count: countMap[c.id] || 0 })));
    if (eventsRes.data) setEvents(eventsRes.data as ClubEvent[]);
    if (membershipsRes.data) setMyClubIds((membershipsRes.data as any[]).map(m => m.club_id));
    if (rsvpsRes.data) setMyRsvpIds((rsvpsRes.data as any[]).map(r => r.event_id));
    if (resourcesRes.data) setResources(resourcesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, role]);

  // --- ACTIONS ---

  const handleJoinLeave = async (clubId: string) => {
    if (!user) return;
    setActionLoading(clubId);
    if (myClubIds.includes(clubId)) {
      const { error } = await supabase.from("club_memberships").delete().eq("club_id", clubId).eq("user_id", user.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Membership Cancelled" });
    } else {
      const { error } = await supabase.from("club_memberships").insert({ club_id: clubId, user_id: user.id });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Welcome to the Club!" });
    }
    setActionLoading(null);
    fetchData();
  };

  const handleRsvp = async (eventId: string) => {
    if (!user) return;
    setActionLoading(eventId);
    if (myRsvpIds.includes(eventId)) {
      await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
      toast({ title: "RSVP Cancelled" });
    } else {
      await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: user.id });
      toast({ title: "RSVP Confirmed!" });
    }
    setActionLoading(null);
    fetchData();
  };

  const handleCreateClub = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("clubs").insert([{ ...newClub, created_by: user?.id }]);
    setSubmitting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Club Created" });
      setShowClubModal(false);
      fetchData();
    }
  };

  const handleCreateEvent = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("club_events").insert([newEvent]);
    setSubmitting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Event Published" });
      setShowEventModal(false);
      fetchData();
    }
  };

  const handleDeleteClub = async (id: string) => {
    if (!confirm("Disband this club? All memberships will be lost.")) return;
    const { error } = await supabase.from("clubs").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Club Removed" }); fetchData(); }
  };

  const handleAddResource = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("resources").insert([{
      ...newResource,
      category: "club",
      uploaded_by: user.id
    }]);
    setSubmitting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Resource Added" });
      setShowResourceModal(false);
      fetchData();
    }
  };

  const myClubs = clubs.filter(c => myClubIds.includes(c.id));

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-[2.2rem] font-semibold text-primary">Student Clubs {isAdmin && "Admin"}</h1>
          <p className="text-muted-foreground">{isAdmin ? "Manage student organizations and campus events" : "Join clubs, attend events, and connect with peers"}</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <button onClick={() => setShowClubModal(true)} className="bg-accent text-primary px-6 py-3 rounded-md font-bold hover:scale-105 transition-all shadow-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Club
              </button>
              <button onClick={() => setShowEventModal(true)} className="bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-usiu-dark-blue transition-all shadow-lg flex items-center gap-2">
                <Calendar className="w-4 h-4" /> New Event
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b-2 border-primary pb-1 overflow-x-auto">
        {[
          { id: "all-clubs", label: "Registry" },
          { id: "my-clubs", label: isAdmin ? "Member Roster" : "My Clubs" },
          { id: "events", label: "Campus Events" },
          { id: "resources", label: "Club Resources" },
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

      {loading && <div className="text-center py-12 text-muted-foreground font-medium">Loading Social Hub...</div>}

      {/* 1. All Clubs */}
      {!loading && activeTab === "all-clubs" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {clubs.map((club) => {
            const isMember = myClubIds.includes(club.id);
            return (
              <div key={club.id} className="bg-card border border-border rounded-2xl p-8 shadow-usiu hover:border-accent transition-all group relative">
                {isAdmin && (
                  <button onClick={() => handleDeleteClub(club.id)} className="absolute top-6 right-6 p-2 text-destructive hover:bg-destructive/10 rounded-full">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-[60px] h-[60px] bg-gradient-to-br from-primary to-usiu-dark-blue rounded-xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-all">
                    {club.icon || "🎯"}
                  </div>
                  <h3 className="text-xl font-bold flex-1 text-primary">{club.name}</h3>
                </div>
                <p className="text-muted-foreground mb-8 leading-relaxed line-clamp-2">{club.description}</p>
                <div className="flex flex-wrap gap-6 mb-8 border-y border-border/50 py-4">
                  <span className="flex items-center gap-2 text-sm font-bold text-primary"><Users className="w-4 h-4 text-accent" /> {club.member_count} Members</span>
                  <span className="flex items-center gap-2 text-sm font-bold text-primary"><DollarSign className="w-4 h-4 text-accent" /> {club.dues || "Free"}</span>
                  <span className="flex items-center gap-2 text-sm font-bold text-primary"><Calendar className="w-4 h-4 text-accent" /> {club.meeting_day || "TBD"}</span>
                </div>
                <div className="flex gap-3">
                  {!isAdmin && (
                    <button
                      onClick={() => handleJoinLeave(club.id)}
                      disabled={actionLoading === club.id}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-md ${
                        isMember ? "bg-destructive text-white hover:bg-red-700" : "bg-primary text-white hover:bg-usiu-dark-blue"
                      }`}
                    >
                      {actionLoading === club.id ? "..." : isMember ? "Leave Club" : "Join Club"}
                    </button>
                  )}
                  {isAdmin && (
                    <button className="flex-1 py-3 bg-secondary text-primary rounded-xl font-bold border border-primary hover:bg-primary hover:text-white transition-all">
                      Manage Roster
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. My Clubs */}
      {!loading && activeTab === "my-clubs" && (
        myClubs.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground font-medium">You haven't joined any clubs yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {myClubs.map((club) => (
              <div key={club.id} className="bg-card border border-border rounded-2xl p-8 shadow-usiu flex items-center gap-6">
                <div className="w-[50px] h-[50px] bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                  {club.icon || "🎯"}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-primary">{club.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">{club.meeting_day} Sessions</p>
                </div>
                <button onClick={() => handleJoinLeave(club.id)} className="text-xs font-black text-destructive uppercase tracking-widest hover:underline">Resign</button>
              </div>
            ))}
          </div>
        )
      )}

      {/* 3. Events */}
      {!loading && activeTab === "events" && (
        <div className="grid grid-cols-1 gap-6">
          {events.length === 0 ? (
            <div className="text-center py-12 italic text-muted-foreground">No events scheduled on the campus calendar.</div>
          ) : events.map((event) => {
            const hasRsvp = myRsvpIds.includes(event.id);
            const dateObj = new Date(event.date);
            return (
              <div key={event.id} className="bg-card border border-border rounded-2xl p-8 shadow-usiu hover:border-accent transition-all flex items-center gap-8">
                <div className="bg-primary text-white p-6 rounded-2xl text-center min-w-[120px] shadow-lg">
                  <span className="text-3xl font-black block">{dateObj.getDate()}</span>
                  <span className="text-xs font-bold uppercase tracking-[0.3em]">{dateObj.toLocaleString("default", { month: "short" })}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <span className="text-[10px] font-black bg-accent/20 text-primary px-3 py-1 rounded-full uppercase tracking-widest">{(event as any).clubs?.name || "Campus Event"}</span>
                  <h4 className="text-xl font-bold text-primary">{event.title}</h4>
                  <div className="flex gap-6 text-sm text-muted-foreground font-medium">
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {event.time || "All Day"}</span>
                    <span className="flex items-center gap-2"><ExternalLink className="w-4 h-4" /> {event.location || "Main Campus"}</span>
                  </div>
                </div>
                {!isAdmin && (
                  <button
                    onClick={() => handleRsvp(event.id)}
                    className={`px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${
                      hasRsvp ? "bg-[#008000]/10 text-[#008000] border-2 border-[#008000]" : "bg-primary text-white hover:bg-usiu-dark-blue shadow-lg"
                    }`}
                  >
                    {hasRsvp ? "✓ GOING" : "I'm Interested"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Resources */}
      {!loading && activeTab === "resources" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-muted-foreground italic">No club documentation available.</div>
          ) : resources.map((res) => (
            <div key={res.id} className="bg-card border border-border rounded-2xl p-8 shadow-usiu hover:border-accent transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 bg-primary/5 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  <FilePlus className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(res.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-bold text-primary mb-6 leading-tight">{res.title}</h3>
              {res.file_url ? (
                <a href={res.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-black text-primary hover:text-accent tracking-widest">
                  ACCESS DOCUMENT <ExternalLink className="w-3 h-3" />
                </a>
              ) : <span className="text-xs text-muted-foreground font-bold">Unpublished</span>}
            </div>
          ))}
          {isAdmin && (
            <button onClick={() => setShowResourceModal(true)} className="border-2 border-dashed border-primary/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-primary/5 transition-all">
              <Plus className="w-10 h-10 text-primary/30" />
              <span className="font-bold text-primary/50">Upload New Guide</span>
            </button>
          )}
        </div>
      )}

      {/* --- ADMIN MODALS --- */}

      {/* Create Club Modal */}
      {showClubModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-[500px] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-primary p-8 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black tracking-tight">Create Organization</h2>
              <button onClick={() => setShowClubModal(false)}><X /></button>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block tracking-[0.2em]">Organization Name</label>
                <input value={newClub.name} onChange={e => setNewClub({...newClub, name: e.target.value})} className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-xl focus:border-accent focus:outline-none font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block tracking-[0.2em]">Mission Statement</label>
                <textarea value={newClub.description} onChange={e => setNewClub({...newClub, description: e.target.value})} className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-xl focus:border-accent focus:outline-none min-h-[100px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block tracking-[0.2em]">Dues</label>
                  <input value={newClub.dues} onChange={e => setNewClub({...newClub, dues: e.target.value})} className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-xl" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block tracking-[0.2em]">Meeting Day</label>
                  <input value={newClub.meeting_day} onChange={e => setNewClub({...newClub, meeting_day: e.target.value})} className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-xl" />
                </div>
              </div>
              <button onClick={handleCreateClub} disabled={submitting} className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-usiu-dark-blue transition-all shadow-xl">
                Register Club
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-[500px] rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-primary p-8 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black tracking-tight uppercase">Schedule Event</h2>
              <button onClick={() => setShowEventModal(false)}><X /></button>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block tracking-[0.2em]">Host Club</label>
                <select value={newEvent.club_id} onChange={e => setNewEvent({...newEvent, club_id: e.target.value})} className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-xl font-bold">
                  <option value="">Select Hosting Organization</option>
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block tracking-[0.2em]">Event Title</label>
                <input value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-xl font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block tracking-[0.2em]">Date</label>
                  <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-xl" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block tracking-[0.2em]">Location</label>
                  <input value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-xl" />
                </div>
              </div>
              <button onClick={handleCreateEvent} disabled={submitting || !newEvent.club_id} className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-usiu-dark-blue transition-all shadow-xl">
                Publish Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-[450px] rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-primary p-8 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase">New Club Asset</h2>
              <button onClick={() => setShowResourceModal(false)}><X /></button>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block tracking-[0.2em]">Asset Title</label>
                <input value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-xl font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block tracking-[0.2em]">External Link</label>
                <input value={newResource.file_url} onChange={e => setNewResource({...newResource, file_url: e.target.value})} className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-xl" placeholder="https://..." />
              </div>
              <button onClick={handleAddResource} disabled={submitting} className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-usiu-dark-blue transition-all shadow-xl">
                Publish Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Clubs;

