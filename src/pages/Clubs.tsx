import { useState } from "react";
import { Users, Calendar, DollarSign } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const sampleClubs = [
  { id: 1, name: "DevClub", description: "A community of developers building cool projects and learning together.", members: 45, dues: "KES 500/sem", icon: "💻", meetingDay: "Wednesdays" },
  { id: 2, name: "Business Club", description: "Entrepreneurship, networking, and business development for aspiring leaders.", members: 60, dues: "KES 1,000/sem", icon: "💼", meetingDay: "Thursdays" },
  { id: 3, name: "Art & Design Club", description: "Creative expression through visual arts, digital design, and photography.", members: 30, dues: "KES 300/sem", icon: "🎨", meetingDay: "Fridays" },
  { id: 4, name: "Sports Club", description: "Stay active with various sports activities and inter-university competitions.", members: 80, dues: "KES 750/sem", icon: "⚽", meetingDay: "Tuesdays" },
];

const sampleEvents = [
  { id: 1, title: "Hackathon 2025", club: "DevClub", date: "Mar 15, 2025", time: "9:00 AM", location: "Engineering Building", description: "24-hour coding competition" },
  { id: 2, title: "Pitch Night", club: "Business Club", date: "Mar 20, 2025", time: "6:00 PM", location: "Business School Auditorium", description: "Present your startup ideas to investors" },
  { id: 3, title: "Art Exhibition", club: "Art & Design Club", date: "Mar 25, 2025", time: "10:00 AM", location: "Student Center", description: "Showcase student artwork and photography" },
];

const Clubs = () => {
  const [activeTab, setActiveTab] = useState("all-clubs");

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

      {/* All Clubs */}
      {activeTab === "all-clubs" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {sampleClubs.map((club) => (
            <div key={club.id} className="bg-card border border-border rounded-xl p-8 shadow-usiu hover:-translate-y-1 hover:shadow-usiu-card hover:border-accent transition-all duration-300">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-[50px] h-[50px] bg-gradient-to-br from-primary to-usiu-dark-blue rounded-md flex items-center justify-center text-2xl">
                  {club.icon}
                </div>
                <h3 className="text-[1.2rem] font-semibold flex-1 text-primary">{club.name}</h3>
              </div>
              <p className="text-muted-foreground mb-6 text-[0.95rem] leading-relaxed">{club.description}</p>
              <div className="flex gap-6 mb-6 text-muted-foreground text-sm">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {club.members} members</span>
                <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {club.dues}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {club.meetingDay}</span>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-usiu-dark-blue transition-all duration-300">
                  Join Club
                </button>
                <button className="flex-1 py-3 bg-secondary text-primary border border-primary rounded-md font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Clubs */}
      {activeTab === "my-clubs" && (
        <div className="text-center text-muted-foreground py-12">You haven't joined any clubs yet.</div>
      )}

      {/* Events */}
      {activeTab === "events" && (
        <div className="space-y-6">
          {sampleEvents.map((event) => (
            <div key={event.id} className="bg-card border border-border rounded-xl p-8 shadow-usiu hover:border-accent transition-all duration-300 flex items-start gap-6">
              <div className="bg-primary text-primary-foreground px-6 py-4 rounded-md text-center min-w-[90px]">
                <span className="text-lg font-bold block">{event.date.split(",")[0].split(" ")[1]}</span>
                <span className="text-sm">{event.date.split(",")[0].split(" ")[0]}</span>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-primary mb-1">{event.title}</h4>
                <p className="text-muted-foreground text-sm mb-1">{event.club} · {event.location}</p>
                <p className="text-muted-foreground text-sm mb-1">{event.time}</p>
                <p className="text-muted-foreground text-sm">{event.description}</p>
              </div>
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium hover:bg-usiu-dark-blue transition-colors">
                RSVP
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Clubs;
