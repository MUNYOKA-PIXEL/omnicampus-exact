import { useState, useEffect } from "react";
import { User, Mail, Phone, BookOpen, GraduationCap, Camera, Save, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { profile, updateProfile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    student_id: "",
    phone: "",
    course: "",
    year_of_study: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        student_id: profile.student_id || "",
        phone: profile.phone || "",
        course: profile.course || "",
        year_of_study: profile.year_of_study?.toString() || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await updateProfile({
      full_name: formData.full_name,
      student_id: formData.student_id,
      phone: formData.phone,
      course: formData.course,
      year_of_study: formData.year_of_study ? parseInt(formData.year_of_study) : null,
    });

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile updated successfully" });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      // Changed filePath format to 'user_id/timestamp.ext' to align with storage RLS folder expectations
      const filePath = `${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);


      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
      if (updateError) throw updateError;

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: "Success", description: "Avatar updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-[2.2rem] font-semibold text-primary">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Avatar & Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-8 shadow-usiu text-center">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-primary/10 border-4 border-accent flex items-center justify-center mx-auto">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-primary" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-accent text-primary p-2 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <h3 className="text-xl font-bold text-primary">{formData.full_name || "Student Name"}</h3>
            <p className="text-muted-foreground mb-4">{profile?.email}</p>
            <div className="flex justify-center gap-2 mb-6">
              <span className="px-3 py-1 bg-accent/20 text-primary text-xs font-semibold rounded-full border border-accent/30">
                {formData.student_id || "No ID"}
              </span>
            </div>
            <div className="border-t border-border pt-6 text-left space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{formData.course || "No Course Set"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Year {formData.year_of_study || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl p-8 shadow-usiu">
            <h3 className="text-lg font-semibold text-primary mb-6">Personal Information</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 text-muted-foreground text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-muted-foreground text-sm font-medium">Student ID</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-muted-foreground font-bold text-xs">ID</span>
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleChange}
                      placeholder="e.g. 654321"
                      className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-muted-foreground text-sm font-medium">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-md text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <small className="text-xs text-muted-foreground mt-1">Email cannot be changed</small>
                </div>
                <div>
                  <label className="block mb-2 text-muted-foreground text-sm font-medium">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Your phone number"
                      className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-muted-foreground text-sm font-medium">Course / Major</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      placeholder="e.g. Computer Science"
                      className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-muted-foreground text-sm font-medium">Year of Study</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <select
                      name="year_of_study"
                      value={formData.year_of_study}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:border-accent transition-all appearance-none"
                    >
                      <option value="">Select Year</option>
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                      <option value="5">Year 5+</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-md font-medium hover:bg-usiu-dark-blue transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 text-accent" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
