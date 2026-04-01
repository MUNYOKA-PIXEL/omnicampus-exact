import { useState, useEffect } from "react";
import { CalendarCheck, History, FileText, Clock, CalendarPlus, Stethoscope, Pill, CreditCard, AlertTriangle, Ambulance } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  available: boolean;
  languages: string | null;
}

interface Medication {
  id: string;
  name: string;
  type: string;
  price: string;
  available: boolean;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  reason: string | null;
  status: string;
  doctor_id: string;
  doctors?: { name: string; specialty: string };
}

const Medical = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("appointments");
  const [showBookModal, setShowBookModal] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Appointment form
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");
  const [apptReason, setApptReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resources = [
    { title: "Mental Health Guide", description: "Tips for managing stress and anxiety during exams", icon: "🧠" },
    { title: "Nutrition Tips", description: "Healthy eating habits for busy students", icon: "🥗" },
    { title: "Exercise Programs", description: "Stay fit with campus workout routines", icon: "💪" },
    { title: "First Aid Basics", description: "Essential first aid knowledge for emergencies", icon: "🩹" },
  ];

  const fetchData = async () => {
    setLoading(true);
    const [docsRes, medsRes, apptsRes] = await Promise.all([
      supabase.from("doctors").select("*").order("name"),
      supabase.from("medications").select("*").order("name"),
      user ? supabase.from("appointments").select("*, doctors(name, specialty)").eq("user_id", user.id).order("date", { ascending: false }) : Promise.resolve({ data: [] }),
    ]);
    if (docsRes.data) setDoctors(docsRes.data);
    if (medsRes.data) setMedications(medsRes.data);
    if (apptsRes.data) setAppointments(apptsRes.data as Appointment[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const upcomingAppts = appointments.filter(a => a.status === "scheduled" && new Date(a.date) >= new Date());
  const pastAppts = appointments.filter(a => a.status !== "scheduled" || new Date(a.date) < new Date());

  const handleBookAppointment = async () => {
    if (!user || !selectedDoctor || !apptDate || !apptTime) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("appointments").insert({
      user_id: user.id,
      doctor_id: selectedDoctor,
      date: apptDate,
      time: apptTime,
      reason: apptReason.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Appointment booked successfully!" });
      setSelectedDoctor(""); setApptDate(""); setApptTime(""); setApptReason("");
      setShowBookModal(false);
      fetchData();
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm("Cancel this appointment?")) return;
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Appointment cancelled" }); fetchData(); }
  };

  const openBookWithDoctor = (doctorId: string) => {
    setSelectedDoctor(doctorId);
    setShowBookModal(true);
  };

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
          <a href="tel:+254700123911" className="ml-auto bg-card text-destructive px-6 py-3 rounded-md font-bold hover:scale-105 hover:shadow-lg hover:bg-accent hover:text-destructive transition-all duration-300 flex items-center gap-2">
            <Ambulance className="w-5 h-5" /> EMERGENCY
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        {[
          { icon: CalendarCheck, value: String(upcomingAppts.length), label: "Upcoming Appointments" },
          { icon: History, value: String(pastAppts.length), label: "Past Visits" },
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
          { icon: FileText, title: "Medical Records", desc: "View your health records", action: () => setActiveTab("appointments") },
          { icon: Pill, title: "Prescriptions", desc: "View and renew prescriptions", action: () => setActiveTab("pharmacy") },
          { icon: CreditCard, title: "Insurance Info", desc: "View insurance details", action: () => toast({ title: "Insurance", description: "Contact admin for insurance details." }) },
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

      {loading && <div className="text-center text-muted-foreground py-12">Loading...</div>}

      {/* Appointments */}
      {!loading && activeTab === "appointments" && (
        appointments.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No appointments scheduled</div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => (
              <div key={appt.id} className="bg-card border border-border rounded-xl p-6 shadow-usiu flex items-center gap-6">
                <div className="bg-primary text-primary-foreground px-4 py-3 rounded-md text-center min-w-[80px]">
                  <span className="text-sm font-bold block">{new Date(appt.date).toLocaleDateString()}</span>
                  <span className="text-xs">{appt.time}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary">{(appt as any).doctors?.name || "Doctor"}</h4>
                  <p className="text-muted-foreground text-sm">{(appt as any).doctors?.specialty || ""}</p>
                  {appt.reason && <p className="text-muted-foreground text-sm mt-1">Reason: {appt.reason}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  appt.status === "scheduled" ? "bg-primary/10 text-primary" : appt.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-[#008000]/10 text-[#008000]"
                }`}>{appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}</span>
                {appt.status === "scheduled" && (
                  <button onClick={() => handleCancelAppointment(appt.id)} className="text-destructive text-sm font-medium hover:underline">Cancel</button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Doctors */}
      {!loading && activeTab === "doctors" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {doctors.map((doc) => (
            <div key={doc.id} className="bg-card border border-border rounded-xl p-5 text-center shadow-usiu hover:-translate-y-1 hover:border-accent hover:shadow-usiu-card transition-all duration-300">
              <div className="w-[100px] h-[100px] bg-gradient-to-br from-primary to-usiu-dark-blue rounded-full mx-auto mb-4 flex items-center justify-center border-[3px] border-accent">
                <Stethoscope className="w-12 h-12 text-accent" />
              </div>
              <h3 className="font-semibold mb-1 text-primary">{doc.name}</h3>
              <p className="text-primary font-medium text-sm mb-3">{doc.specialty}</p>
              <span className={`text-sm px-3 py-1 rounded-full inline-block mb-3 ${doc.available ? "bg-[#008000]/10 text-[#008000]" : "bg-destructive/10 text-destructive"}`}>
                {doc.available ? "Available" : "Unavailable"}
              </span>
              <p className="text-muted-foreground text-xs">🌐 {doc.languages || "English"}</p>
              <button
                onClick={() => doc.available && openBookWithDoctor(doc.id)}
                disabled={!doc.available}
                className="mt-4 w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-usiu-dark-blue transition-colors disabled:opacity-50"
              >
                Book Appointment
              </button>
            </div>
          ))}
          {doctors.length === 0 && <div className="col-span-4 text-center text-muted-foreground py-12">No doctors available</div>}
        </div>
      )}

      {/* Pharmacy */}
      {!loading && activeTab === "pharmacy" && (
        <div>
          <h3 className="font-semibold text-primary mb-5">Available Medications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {medications.map((med) => (
              <div key={med.id} className="bg-card border border-border rounded-xl p-5 text-center shadow-usiu hover:-translate-y-1 hover:border-accent transition-all duration-300">
                <Pill className="w-10 h-10 text-primary mx-auto mb-3" />
                <h4 className="font-semibold text-primary mb-1">{med.name}</h4>
                <p className="text-muted-foreground text-sm mb-1">{med.type}</p>
                <p className="font-bold text-[#008000] text-[1.1rem] my-3">{med.price}</p>
                <button
                  onClick={() => toast({ title: "Request Sent", description: `${med.name} request submitted. Visit pharmacy to collect.` })}
                  disabled={!med.available}
                  className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-usiu-dark-blue transition-colors disabled:opacity-50"
                >
                  {med.available ? "Request" : "Out of Stock"}
                </button>
              </div>
            ))}
            {medications.length === 0 && <div className="col-span-4 text-center text-muted-foreground py-12">No medications listed</div>}
          </div>
        </div>
      )}

      {/* Resources */}
      {!loading && activeTab === "resources" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {resources.map((res) => (
            <div key={res.title} className="bg-card border border-border rounded-xl p-5 text-center shadow-usiu hover:-translate-y-1 hover:border-accent transition-all duration-300">
              <span className="text-4xl block mb-4">{res.icon}</span>
              <h4 className="font-semibold text-primary mb-3">{res.title}</h4>
              <p className="text-muted-foreground text-sm mb-4">{res.description}</p>
              <button
                onClick={() => toast({ title: res.title, description: res.description })}
                className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-usiu-dark-blue transition-colors"
              >
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
                <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent">
                  <option value="">Select a doctor</option>
                  {doctors.filter(d => d.available).map(d => <option key={d.id} value={d.id}>{d.name} - {d.specialty}</option>)}
                </select>
              </div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Date</label><input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Time</label><input type="time" value={apptTime} onChange={e => setApptTime(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent" /></div>
              <div><label className="block mb-2 text-muted-foreground text-sm font-medium">Reason</label><textarea value={apptReason} onChange={e => setApptReason(e.target.value)} className="w-full px-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent min-h-[100px] resize-y" placeholder="Describe your symptoms or reason" /></div>
              <button
                onClick={handleBookAppointment}
                disabled={submitting}
                className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-usiu-dark-blue transition-colors duration-300 disabled:opacity-50"
              >
                {submitting ? "Booking..." : "Book Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Medical;
