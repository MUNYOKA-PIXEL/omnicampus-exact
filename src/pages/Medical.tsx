import { useState, useEffect } from "react";
import { CalendarCheck, History, FileText, Clock, CalendarPlus, Stethoscope, Pill, CreditCard, AlertTriangle, Ambulance, Plus, Trash2, Check, X, FilePlus, ExternalLink } from "lucide-react";
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
  profiles?: { full_name: string; student_id: string };
}

interface Resource {
  id: string;
  title: string;
  file_url: string | null;
  category: string;
  created_at: string;
}

const Medical = () => {
  const { user, role } = useAuth();
  const isAdmin = role === "medadmin" || role === "superadmin";
  
  const [activeTab, setActiveTab] = useState("appointments");
  const [showBookModal, setShowBookModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");
  const [apptReason, setApptReason] = useState("");
  
  const [newDoctor, setNewDoctor] = useState({ name: "", specialty: "", languages: "English", available: true });
  const [newMed, setNewMed] = useState({ name: "", type: "", price: "KES 0", available: true });
  const [newResource, setNewResource] = useState({ title: "", file_url: "" });

  const fetchData = async () => {
    setLoading(true);
    const promises = [
      supabase.from("doctors").select("*").order("name"),
      supabase.from("medications").select("*").order("name"),
      isAdmin 
        ? supabase.from("appointments").select("*, doctors(name, specialty), profiles(full_name, student_id)").order("date", { ascending: false })
        : (user ? supabase.from("appointments").select("*, doctors(name, specialty)").eq("user_id", user.id).order("date", { ascending: false }) : Promise.resolve({ data: [] })),
      supabase.from("resources").select("*").eq("category", "medical").order("created_at", { ascending: false }),
    ];

    const [docsRes, medsRes, apptsRes, resourcesRes] = await Promise.all(promises);
    
    if (docsRes.data) setDoctors(docsRes.data);
    if (medsRes.data) setMedications(medsRes.data);
    if (apptsRes.data) setAppointments(apptsRes.data as Appointment[]);
    if (resourcesRes.data) setResources(resourcesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, role]);

  const upcomingAppts = appointments.filter(a => a.status === "scheduled" && new Date(a.date) >= new Date());
  const pastAppts = appointments.filter(a => a.status !== "scheduled" || new Date(a.date) < new Date());

  // --- ACTIONS ---

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

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Appointment ${status}` }); fetchData(); }
  };

  const handleAddDoctor = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("doctors").insert([newDoctor]);
    setSubmitting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Doctor Added" });
      setShowDoctorModal(false);
      setNewDoctor({ name: "", specialty: "", languages: "English", available: true });
      fetchData();
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm("Remove this doctor from records?")) return;
    const { error } = await supabase.from("doctors").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Doctor Removed" }); fetchData(); }
  };

  const handleAddMedication = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("medications").insert([newMed]);
    setSubmitting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Inventory Updated" });
      setShowMedicationModal(false);
      setNewMed({ name: "", type: "", price: "KES 0", available: true });
      fetchData();
    }
  };

  const handleAddResource = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("resources").insert([{
      ...newResource,
      category: "medical",
      uploaded_by: user.id
    }]);
    setSubmitting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Health Resource Added" });
      setShowResourceModal(false);
      setNewResource({ title: "", file_url: "" });
      fetchData();
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-[2.2rem] font-semibold text-primary">Medical {isAdmin ? "Admin" : "Services"}</h1>
          <p className="text-muted-foreground">{isAdmin ? "Manage campus health center records" : "Campus health center and wellness resources"}</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <button onClick={() => setShowDoctorModal(true)} className="bg-accent text-primary px-6 py-3 rounded-md font-bold hover:scale-105 transition-all shadow-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Practitioner
              </button>
              <button onClick={() => setShowResourceModal(true)} className="bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-usiu-dark-blue transition-all shadow-lg flex items-center gap-2">
                <FilePlus className="w-4 h-4" /> Add Wellness Guide
              </button>
            </>
          )}
        </div>
      </div>

      {/* Emergency Banner */}
      {!isAdmin && (
        <div className="bg-destructive rounded-xl p-5 mb-8 text-primary-foreground shadow-lg border-2 border-accent/20">
          <div className="flex items-center gap-5 flex-wrap">
            <AlertTriangle className="w-12 h-12 text-accent" />
            <div>
              <h3 className="font-bold text-lg">MEDICAL EMERGENCY?</h3>
              <p>Call campus security: <strong>+254 700 123 911</strong> or dial <strong>911</strong></p>
            </div>
            <a href="tel:+254700123911" className="ml-auto bg-card text-destructive px-6 py-3 rounded-md font-bold hover:bg-accent hover:text-destructive transition-all flex items-center gap-2">
              <Ambulance className="w-5 h-5" /> CALL NOW
            </a>
          </div>
        </div>
      )}



      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {[
          { icon: CalendarCheck, value: String(upcomingAppts.length), label: isAdmin ? "Total Pending" : "Upcoming Visits" },
          { icon: History, value: String(pastAppts.length), label: isAdmin ? "Cases Completed" : "Past Visits" },
          { icon: Stethoscope, value: String(doctors.length), label: "Active Doctors" },
          { icon: Pill, value: String(medications.length), label: "Pharmacy Stock" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-usiu hover:border-accent transition-all">
              <div className="p-4 rounded-full mb-4" style={{ background: "rgba(0,51,102,0.1)" }}>
                <Icon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-[2.2rem] font-black text-primary leading-none mb-2">{stat.value}</h3>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
            </div>
          );
        })}
      </div>


      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b-2 border-primary pb-1 overflow-x-auto">
        {[
          { id: "appointments", label: isAdmin ? "Full Schedule" : "My Appointments" },
          { id: "doctors", label: "Practitioners" },
          { id: "pharmacy", label: "Pharmacy" },
          { id: "resources", label: "Wellness Library" },
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

      {loading && <div className="text-center py-12 text-muted-foreground">Synchronizing Records...</div>}

      {/* 1. Appointments */}
      {!loading && activeTab === "appointments" && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-xl">No active appointments found.</div>
          ) : appointments.map((appt) => (
            <div key={appt.id} className="bg-card border border-border rounded-xl p-6 shadow-usiu flex items-center gap-6 hover:border-accent transition-all group">
              <div className="bg-primary text-primary-foreground px-4 py-3 rounded-lg text-center min-w-[100px] group-hover:bg-usiu-dark-blue transition-all">
                <span className="text-sm font-bold block">{new Date(appt.date).toLocaleDateString()}</span>
                <span className="text-xs opacity-80">{appt.time}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-primary">{isAdmin ? appt.profiles?.full_name : appt.doctors?.name}</h4>
                <p className="text-muted-foreground text-sm">
                  {isAdmin ? `ID: ${appt.profiles?.student_id}` : appt.doctors?.specialty}
                </p>
                {appt.reason && <p className="text-sm mt-2 italic text-muted-foreground">"{appt.reason}"</p>}
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  appt.status === "scheduled" ? "bg-primary/10 text-primary" : 
                  appt.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-[#008000]/10 text-[#008000]"
                }`}>{appt.status}</span>
                {isAdmin && appt.status === "scheduled" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdateStatus(appt.id, "completed")} className="p-2 bg-[#008000] text-white rounded-md hover:scale-105 transition-all"><Check className="w-4 h-4" /></button>
                    <button onClick={() => handleUpdateStatus(appt.id, "cancelled")} className="p-2 bg-destructive text-white rounded-md hover:scale-105 transition-all"><X className="w-4 h-4" /></button>
                  </div>
                )}
                {!isAdmin && appt.status === "scheduled" && (
                  <button onClick={() => handleUpdateStatus(appt.id, "cancelled")} className="text-xs text-destructive font-bold hover:underline">Cancel Request</button>
                )}
              </div>
            </div>
          ))}
          {!isAdmin && (
            <button onClick={() => setShowBookModal(true)} className="w-full py-4 border-2 border-dashed border-primary/30 rounded-xl text-primary font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
              <CalendarPlus className="w-5 h-5" /> Book New Appointment
            </button>
          )}
        </div>
      )}

      {/* 2. Doctors */}
      {!loading && activeTab === "doctors" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.map((doc) => (
            <div key={doc.id} className="bg-card border border-border rounded-2xl p-6 text-center shadow-usiu hover:border-accent transition-all group relative">
              {isAdmin && (
                <button onClick={() => handleDeleteDoctor(doc.id)} className="absolute top-4 right-4 p-2 text-destructive hover:bg-destructive/10 rounded-full transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="w-[100px] h-[100px] bg-gradient-to-br from-primary to-usiu-dark-blue rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-accent/20 group-hover:border-accent transition-all shadow-lg">
                <Stethoscope className="w-12 h-12 text-accent" />
              </div>
              <h3 className="font-bold text-primary text-lg">{doc.name}</h3>
              <p className="text-primary font-medium text-xs mb-4 uppercase tracking-tighter">{doc.specialty}</p>
              <div className="flex flex-col gap-3">
                <span className={`text-[10px] font-bold uppercase py-1 px-3 rounded-full mx-auto ${doc.available ? "bg-[#008000]/10 text-[#008000]" : "bg-destructive/10 text-destructive"}`}>
                  {doc.available ? "Ready for Visit" : "Out of Clinic"}
                </span>
                {!isAdmin && (
                  <button
                    onClick={() => doc.available && (setSelectedDoctor(doc.id), setShowBookModal(true))}
                    disabled={!doc.available}
                    className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-usiu-dark-blue transition-all disabled:opacity-50 mt-2"
                  >
                    Select Doctor
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Pharmacy */}
      {!loading && activeTab === "pharmacy" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <Pill className="w-5 h-5 text-accent" /> Medication Registry
            </h3>
            {isAdmin && (
              <button onClick={() => setShowMedicationModal(true)} className="text-sm bg-primary text-white px-4 py-2 rounded-md font-bold hover:bg-usiu-dark-blue transition-all">
                + Add Medicine
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {medications.map((med) => (
              <div key={med.id} className="bg-card border border-border rounded-xl p-6 shadow-usiu hover:border-accent transition-all">
                <div className="p-3 bg-primary/5 rounded-lg w-fit mb-4">
                  <Pill className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-bold text-primary mb-1">{med.name}</h4>
                <p className="text-muted-foreground text-xs font-medium uppercase">{med.type}</p>
                <div className="mt-6 flex justify-between items-center">
                  <p className="font-black text-[#008000] text-lg">{med.price}</p>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-md ${med.available ? "bg-[#008000]/10 text-[#008000]" : "bg-destructive/10 text-destructive"}`}>
                    {med.available ? "IN STOCK" : "ORDERED"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Resources */}
      {!loading && activeTab === "resources" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.length === 0 ? (
            <div className="col-span-4 text-center py-12 text-muted-foreground italic">No wellness guides published yet.</div>
          ) : resources.map((res) => (
            <div key={res.id} className="bg-card border border-border rounded-2xl p-6 shadow-usiu hover:border-accent transition-all group">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-all">
                <FileText className="w-7 h-7 text-primary group-hover:text-white" />
              </div>
              <h4 className="font-bold text-primary mb-4 leading-tight">{res.title}</h4>
              {res.file_url ? (
                <a
                  href={res.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-black text-primary hover:text-accent transition-colors"
                >
                  ACCESS RESOURCE <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <p className="text-xs text-muted-foreground font-bold italic">Draft Only</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --- ADMIN MODALS --- */}

      {/* Add Practitioner Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-[450px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2"><Plus className="text-accent" /> New Practitioner</h2>
              <button onClick={() => setShowDoctorModal(false)}><X /></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block tracking-widest">Full Name</label>
                <input value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg" placeholder="Dr. ..." />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block tracking-widest">Specialization</label>
                <input value={newDoctor.specialty} onChange={e => setNewDoctor({...newDoctor, specialty: e.target.value})} className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg" placeholder="e.g. General Medicine" />
              </div>
              <button onClick={handleAddDoctor} disabled={submitting || !newDoctor.name} className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-usiu-dark-blue transition-all disabled:opacity-50 shadow-lg">
                {submitting ? "Saving..." : "Add to Medical Staff"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {showMedicationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-[450px] rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2"><Pill className="text-accent" /> Update Inventory</h2>
              <button onClick={() => setShowMedicationModal(false)}><X /></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block tracking-widest">Medication Name</label>
                <input value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block tracking-widest">Price (KES)</label>
                  <input value={newMed.price} onChange={e => setNewMed({...newMed, price: e.target.value})} className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block tracking-widest">Type</label>
                  <input value={newMed.type} onChange={e => setNewMed({...newMed, type: e.target.value})} className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg" placeholder="e.g. Tablet" />
                </div>
              </div>
              <button onClick={handleAddMedication} disabled={submitting || !newMed.name} className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-usiu-dark-blue transition-all shadow-lg">
                Save to Pharmacy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-[500px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-primary text-white">
              <h2 className="text-xl font-bold flex items-center gap-3"><CalendarPlus className="text-accent" /> Schedule a Visit</h2>
              <button onClick={() => setShowBookModal(false)} className="hover:text-accent"><X /></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block tracking-widest">Select Doctor</label>
                <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl focus:outline-none focus:border-accent">
                  <option value="">Select a practitioner</option>
                  {doctors.filter(d => d.available).map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block tracking-widest">Preferred Date</label>
                  <input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block tracking-widest">Preferred Time</label>
                  <input type="time" value={apptTime} onChange={e => setApptTime(e.target.value)} className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block tracking-widest">Reason for Visit</label>
                <textarea value={apptReason} onChange={e => setApptReason(e.target.value)} className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl min-h-[100px] resize-none" placeholder="Describe your symptoms briefly..." />
              </div>
              <button onClick={handleBookAppointment} disabled={submitting || !selectedDoctor} className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-usiu-dark-blue transition-all disabled:opacity-50 shadow-lg uppercase tracking-widest">
                {submitting ? "Booking..." : "Confirm Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-[450px] rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2"><FilePlus className="text-accent" /> New Wellness Resource</h2>
              <button onClick={() => setShowResourceModal(false)}><X /></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block tracking-widest">Guide Title</label>
                <input value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg" placeholder="e.g. Anxiety Management Guide" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block tracking-widest">Resource Link</label>
                <input value={newResource.file_url} onChange={e => setNewResource({...newResource, file_url: e.target.value})} className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg" placeholder="https://..." />
              </div>
              <button onClick={handleAddResource} disabled={submitting || !newResource.title} className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-usiu-dark-blue transition-all shadow-lg">
                Publish Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Medical;

