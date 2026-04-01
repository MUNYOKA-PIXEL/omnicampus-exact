import { useState, useEffect } from "react";
import { Users, Calendar, DollarSign } from "lucide-react";
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

const Clubs = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all-clubs");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [myClubIds, setMyClubIds] = useState<string[]>([]);
  const [myRsvpIds, setMyRsvpIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [clubsRes, eventsRes, membershipsRes, rsvpsRes, countsRes] = await Promise.all([
      supabase.from("clubs").select("*").order("name"),
      supabase.from("club_events").select("*, clubs(name)").order("date"),
      user ? supabase.from("club_memberships").select("club_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
      user ? supabase.from("event_rsvps").select("event_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
      supabase.from("club_memberships").select("club_id"),
    ]);

    // Count members per club
    const countMap: Record<string, number> = {};
    (countsRes.data || []).forEach((m: any) => { countMap[m.club_id] = (countMap[m.club_id] || 0) + 1; });

    if (clubsRes.data) setClubs(clubsRes.data.map(c => ({ ...c, member_count: countMap[c.id] || 0 })));
    if (eventsRes.data) setEvents(eventsRes.data as ClubEvent[]);
    if (membershipsRes.data) setMyClubIds((membershipsRes.data as any[]).map(m => m.club_id));
    if (rsvpsRes.data) setMyRsvpIds((rsvpsRes.data as any[]).map(r => r.event_id));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleJoinLeave = async (clubId: string) => {
    if (!user) return;
    setActionLoading(clubId);
    if (myClubIds.includes(clubId)) {
      const { error } = await supabase.from("club_memberships").delete().eq("club_id", clubId).eq("user_id", user.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Left club successfully" });
    } else {
      const { error } = await supabase.from("club_memberships").insert({ club_id: clubId, user_id: user.id });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Joined club successfully!" });
    }
    setActionLoading(null);
    fetchData();
  };

  const handleRsvp = async (eventId: string) => {
    if (!user) return;
    setActionLoading(eventId);
    if (myRsvpIds.includes(eventId)) {
      const { error } = await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "RSVP cancelled" });
    } else {
      const { error } = await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: user.id });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "RSVP confirmed!" });
    }
    setActionLoading(null);
    fetchData();
  };

  const myClubs = clubs.filter(c => myClubIds.includes(c.id));

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-[2.2rem] font-semibold text-primary">Student Clubs</h1>
          <p className="text-muted-foreground">Join clubs, attend events, and connect with peers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b-2 border-primary pb-1">
        {[
          { id: "all-clubs", label: "All Clubs" },
          { id: "my-clubs", label: "My Clubs" },
          { id: "events", label: "Events" },
        ].map((tab) => (
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

      {/* All Clubs */}
      {!loading && activeTab === "all-clubs" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {clubs.map((club) => {
            const isMember = myClubIds.includes(club.id);
            return (
              <div key={club.id} className="bg-card border border-border rounded-xl p-8 shadow-usiu hover:-translate-y-1 hover:shadow-usiu-card hover:border-accent transition-all duration-300">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-[50px] h-[50px] bg-gradient-to-br from-primary to-usiu-dark-blue rounded-md flex items-center justify-center text-2xl">
                    {club.icon || "🎯"}
                  </div>
                  <h3 className="text-[1.2rem] font-semibold flex-1 text-primary">{club.name}</h3>
                </div>
                <p className="text-muted-foreground mb-6 text-[0.95rem] leading-relaxed">{club.description}</p>
                <div className="flex gap-6 mb-6 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {club.member_count} members</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {club.dues || "Free"}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {club.meeting_day || "TBD"}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleJoinLeave(club.id)}
                    disabled={actionLoading === club.id}
                    className={`flex-1 py-3 rounded-md font-medium transition-all duration-300 disabled:opacity-50 ${
                      isMember ? "bg-destructive text-primary-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-usiu-dark-blue"
                    }`}
                  >
                    {actionLoading === club.id ? "..." : isMember ? "Leave Club" : "Join Club"}
                  </button>
                  <button className="flex-1 py-3 bg-secondary text-primary border border-primary rounded-md font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
          {clubs.length === 0 && <div className="col-span-2 text-center text-muted-foreground py-12">No clubs available</div>}
        </div>
      )}

      {/* My Clubs */}
      {!loading && activeTab === "my-clubs" && (
        myClubs.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">You haven't joined any clubs yet.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {myClubs.map((club) => (
              <div key={club.id} className="bg-card border border-border rounded-xl p-8 shadow-usiu hover:-translate-y-1 hover:shadow-usiu-card hover:border-accent transition-all duration-300">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-[50px] h-[50px] bg-gradient-to-br from-primary to-usiu-dark-blue rounded-md flex items-center justify-center text-2xl">
                    {club.icon || "🎯"}
                  </div>
                  <h3 className="text-[1.2rem] font-semibold flex-1 text-primary">{club.name}</h3>
                </div>
                <p className="text-muted-foreground mb-6 text-[0.95rem] leading-relaxed">{club.description}</p>
                <div className="flex gap-6 mb-6 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {club.member_count} members</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {club.dues || "Free"}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {club.meeting_day || "TBD"}</span>
                </div>
                <button
                  onClick={() => handleJoinLeave(club.id)}
                  disabled={actionLoading === club.id}
                  className="w-full py-3 bg-destructive text-primary-foreground rounded-md font-medium hover:bg-destructive/90 transition-all duration-300 disabled:opacity-50"
                >
                  {actionLoading === club.id ? "..." : "Leave Club"}
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Events */}
      {!loading && activeTab === "events" && (
        <div className="space-y-6">
          {events.map((event) => {
            const hasRsvp = myRsvpIds.includes(event.id);
            const dateObj = new Date(event.date);
            const day = dateObj.getDate();
            const month = dateObj.toLocaleString("default", { month: "short" });
            return (
              <div key={event.id} className="bg-card border border-border rounded-xl p-8 shadow-usiu hover:border-accent transition-all duration-300 flex items-start gap-6">
                <div className="bg-primary text-primary-foreground px-6 py-4 rounded-md text-center min-w-[90px]">
                  <span className="text-lg font-bold block">{day}</span>
                  <span className="text-sm">{month}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-primary mb-1">{event.title}</h4>
                  <p className="text-muted-foreground text-sm mb-1">{(event as any).clubs?.name || "Club"} · {event.location || "TBD"}</p>
                  <p className="text-muted-foreground text-sm mb-1">{event.time || ""}</p>
                  <p className="text-muted-foreground text-sm">{event.description}</p>
                </div>
                <button
                  onClick={() => handleRsvp(event.id)}
                  disabled={actionLoading === event.id}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
                    hasRsvp ? "bg-destructive text-primary-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-usiu-dark-blue"
                  }`}
                >
                  {actionLoading === event.id ? "..." : hasRsvp ? "Cancel RSVP" : "RSVP"}
                </button>
              </div>
            );
          })}
          {events.length === 0 && <div className="text-center text-muted-foreground py-12">No upcoming events</div>}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Clubs;
