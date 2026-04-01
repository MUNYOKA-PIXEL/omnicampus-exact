import { useState } from "react";
import { CalendarCheck, History, FileText, Clock, CalendarPlus, Stethoscope, Pill, CreditCard, AlertTriangle, Ambulance } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const Medical = () => {
  const [activeTab, setActiveTab] = useState("appointments");
  const [showBookModal, setShowBookModal] = useState(false);

  const doctors = [
    { name: "Dr. Sarah Kimani", specialty: "General Practitioner", available: true, languages: "English, Swahili" },
    { name: "Dr. James Ochieng", specialty: "Dentist", available: true, languages: "English, Swahili" },
    { name: "Dr. Amina Hassan", specialty: "Psychologist", available: false, languages: "English, Swahili, Arabic" },
    { name: "Dr. Peter Mwangi", specialty: "Physiotherapist", available: true, languages: "English, Swahili" },
  ];

  const medications = [
    { name: "Paracetamol", type: "Pain Relief", price: "KES 50", icon: Pill },
    { name: "Amoxicillin", type: "Antibiotic", price: "KES 200", icon: Pill },
    { name: "Ibuprofen", type: "Anti-inflammatory", price: "KES 80", icon: Pill },
    { name: "Loratadine", type: "Antihistamine", price: "KES 120", icon: Pill },
  ];

  const resources = [
    { title: "Mental Health Guide", description: "Tips for managing stress and anxiety during exams", icon: "🧠" },
    { title: "Nutrition Tips", description: "Healthy eating habits for busy students", icon: "🥗" },
    { title: "Exercise Programs", description: "Stay fit with campus workout routines", icon: "💪" },
    { title: "First Aid Basics", description: "Essential first aid knowledge for emergencies", icon: "🩹" },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-[2.2rem] font-semibold text-primary">Medical Services</h1>
          <p className="text-muted-foreground">Campus health center and wellness resources</p>
        </div>
      </div>

      {/* Emergency Banner */}
      <div className="bg-destructive rounded-xl p-5 mb-8 text-primary-foreground animate-pulse">
        <div className="flex items-center gap-5 flex-wrap">
          <AlertTriangle className="w-12 h-12 text-accent" />
          <div>
            <h3 className="font-semibold text-lg">Medical Emergency?</h3>
            <p>Call campus security: <strong>+254 700 123 911</strong> or dial <strong>911</strong> from any campus phone</p>
          </div>
          <button className="ml-auto bg-card text-destructive px-6 py-3 rounded-md font-bold hover:scale-105 hover:shadow-lg hover:bg-accent hover:text-destructive transition-all duration-300 flex items-center gap-2">
            <Ambulance className="w-5 h-5" /> EMERGENCY
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        {[
          { icon: CalendarCheck, value: "0", label: "Upcoming Appointments" },
          { icon: History, value: "0", label: "Past Visits" },
          { icon: FileText, value: "0", label: "Active Prescriptions" },
          { icon: Clock, value: "15", label: "Avg. Wait Time (min)" },
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { icon: CalendarPlus, title: "Book Appointment", desc: "Schedule a visit with our doctors", action: () => setShowBookModal(true) },
          { icon: FileText, title: "Medical Records", desc: "View your health records", action: () => {} },
          { icon: Pill, title: "Prescriptions", desc: "View and renew prescriptions", action: () => {} },
          { icon: CreditCard, title: "Insurance Info", desc: "View insurance details", action: () => {} },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              onClick={item.action}
              className="bg-card border border-border rounded-xl p-5 text-left w-full shadow-usiu hover:-translate-y-1 hover:border-accent hover:shadow-usiu-card transition-all duration-300"
            >
              <Icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2 text-primary">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b-2 border-primary pb-1">
        {[
          { id: "appointments", label: "My Appointments" },
          { id: "doctors", label: "Doctors" },
          { id: "pharmacy", label: "Pharmacy" },
          { id: "resources", label: "Health Resources" },
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

      {/* Appointments */}
      {activeTab === "appointments" && (
        <div className="text-center text-muted-foreground py-12">No appointments scheduled</div>
      )}

      {/* Doctors */}
      {activeTab === "doctors" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {doctors.map((doc) => (
            <div key={doc.name} className="bg-card border border-border rounded-xl p-5 text-center shadow-usiu hover:-translate-y-1 hover:border-accent hover:shadow-usiu-card transition-all duration-300">
              <div className="w-[100px] h-[100px] bg-gradient-to-br from-primary to-usiu-dark-blue rounded-full mx-auto mb-4 flex items-center justify-center border-[3px] border-accent">
                <Stethoscope className="w-12 h-12 text-accent" />
              </div>
              <h3 className="font-semibold mb-1 text-primary">{doc.name}</h3>
              <p className="text-primary font-medium text-sm mb-3">{doc.specialty}</p>
              <span className={`text-sm px-3 py-1 rounded-full inline-block mb-3 ${doc.available ? "bg-[#008000]/10 text-[#008000]" : "bg-destructive/10 text-destructive"}`}>
                {doc.available ? "Available" : "Unavailable"}
              </span>
              <p className="text-muted-foreground text-xs">🌐 {doc.languages}</p>
              <button className="mt-4 w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-usiu-dark-blue transition-colors">
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pharmacy */}
      {activeTab === "pharmacy" && (
        <div>
          <h3 className="font-semibold text-primary mb-5">Available Medications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {medications.map((med) => (
              <div key={med.name} className="bg-card border border-border rounded-xl p-5 text-center shadow-usiu hover:-translate-y-1 hover:border-accent transition-all duration-300">
                <Pill className="w-10 h-10 text-primary mx-auto mb-3" />
                <h4 className="font-semibold text-primary mb-1">{med.name}</h4>
                <p className="text-muted-foreground text-sm mb-1">{med.type}</p>
                <p className="font-bold text-[#008000] text-[1.1rem] my-3">{med.price}</p>
                <button className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-usiu-dark-blue transition-colors">
                  Request
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources */}
      {activeTab === "resources" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {resources.map((res) => (
            <div key={res.title} className="bg-card border border-border rounded-xl p-5 text-center shadow-usiu hover:-translate-y-1 hover:border-accent transition-all duration-300">
              <span className="text-4xl block mb-4">{res.icon}</span>
              <h4 className="font-semibold text-primary mb-3">{res.title}</h4>
              <p className="text-muted-foreground text-sm mb-4">{res.description}</p>
              <button className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-usiu-dark-blue transition-colors">
                Learn More
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center" onClick={() => setShowBookModal(false)}>
          <div className="bg-card border border-border rounded-xl w-[90%] max-w-[500px] max-h-[90vh] overflow-y-auto shadow-usiu-card" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-6 border-b flex justify-between items-center bg-primary text-primary-foreground">
              <h2 className="text-[1.3rem] flex items-center gap-3"><CalendarPlus className="w-5 h-5 text-accent" /> Book Appointment</h2>
              <button onClick={() => setShowBookModal(false)} className="text-primary-foreground hover:text-accent text-xl">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Doctor</label>
                <select className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent">
                  <option>Select a doctor</option>
                  {doctors.filter(d => d.available).map(d => <option key={d.name}>{d.name} - {d.specialty}</option>)}
                </select>
              </div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Date</label><input type="date" className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Time</label><input type="time" className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Reason</label><textarea className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent min-h-[100px] resize-y" placeholder="Describe your symptoms or reason" /></div>
              <button className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-usiu-dark-blue transition-colors duration-300">Book Appointment</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Medical;
