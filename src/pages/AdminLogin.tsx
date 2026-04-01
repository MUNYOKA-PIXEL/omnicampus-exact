import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { fetchUserRole } from "@/services/auth";
import { getRoleDashboardPath, isAdminRole } from "@/types/roles";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      setIsLoading(false);
      toast({ 
        title: "Login Failed", 
        description: "Invalid credentials. Please check your email and password.", 
        variant: "destructive" 
      });
      return;
    }

    // Verify user has an admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const role = await fetchUserRole(user.id);
      setIsLoading(false);
      
      if (isAdminRole(role)) {
        toast({ title: "Login Successful", description: `Welcome back, Admin!` });
        navigate(getRoleDashboardPath(role));
      } else {
        await supabase.auth.signOut();
        toast({ 
          title: "Access Denied", 
          description: "This page is for administrators only. Students should use the regular login page.", 
          variant: "destructive" 
        });
      }
    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-usiu-dark-blue flex items-center justify-center">
      <div className="w-full max-w-[500px] p-8">
        <div className="bg-card rounded-xl overflow-hidden shadow-usiu-card">
          {/* Header */}
          <div className="bg-primary text-center p-8 border-b border-border">
            <h1 className="text-[2rem] font-bold text-accent mb-1">OmniCampus</h1>
            <h2 className="text-xl text-primary-foreground font-semibold">Admin Login</h2>
            <p className="text-primary-foreground/90 mt-2">Access your administrative dashboard</p>
          </div>

          {/* Admin Login Form */}
          <div className="p-8">
            <form onSubmit={handleAdminLogin}>
              <div className="mb-6">
                <label className="block mb-2 text-muted-foreground text-sm font-medium">Admin Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your admin email"
                  required
                  className="w-full px-4 py-3 bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,215,0,0.1)] transition-all duration-300"
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-muted-foreground text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,215,0,0.1)] transition-all duration-300"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-4 rounded-md font-medium text-base hover:bg-usiu-dark-blue transition-colors duration-300 disabled:opacity-50"
              >
                {isLoading ? "Authenticating..." : "Admin Login"}
              </button>
            </form>
            
            <div className="text-center mt-6 pt-6 border-t border-border text-muted-foreground">
              <p className="text-sm">
                If you are a student, please use the{" "}
                <Link to="/login" className="text-primary font-medium">
                  Student Login
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center p-6 border-t border-border text-muted-foreground">
            <Link to="/" className="text-primary font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
