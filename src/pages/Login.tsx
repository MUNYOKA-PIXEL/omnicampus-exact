import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [activeTab, setActiveTab] = useState<"student" | "admin">("student");
  const [studentId, setStudentId] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(studentId, studentPassword);
    setIsLoading(false);
    if (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(adminUsername, adminPassword);
    setIsLoading(false);
    if (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-usiu-dark-blue flex items-center justify-center">
      <div className="w-full max-w-[500px] p-8">
        <div className="bg-card rounded-xl overflow-hidden shadow-usiu-card">
          {/* Header */}
          <div className="bg-primary text-center p-8 border-b border-border">
            <h1 className="text-[2rem] font-bold text-accent mb-1">OmniCampus</h1>
            <p className="text-primary-foreground/90">Welcome back! Please login to your account</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("student")}
              className={`flex-1 py-4 text-base transition-all duration-300 border-b-[3px] ${
                activeTab === "student"
                  ? "text-primary border-accent font-semibold"
                  : "text-muted-foreground border-transparent hover:text-primary"
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 py-4 text-base transition-all duration-300 border-b-[3px] ${
                activeTab === "admin"
                  ? "text-primary border-accent font-semibold"
                  : "text-muted-foreground border-transparent hover:text-primary"
              }`}
            >
              Admin
            </button>
          </div>

          {/* Student Login */}
          {activeTab === "student" && (
            <div className="p-8">
              <form onSubmit={handleStudentLogin}>
                <div className="mb-6">
                  <label className="block mb-2 text-muted-foreground text-sm font-medium">Student ID / Email</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter your student ID or email"
                    required
                    className="w-full px-4 py-3 bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,215,0,0.1)] transition-all duration-300"
                  />
                </div>
                <div className="mb-6">
                  <label className="block mb-2 text-muted-foreground text-sm font-medium">Password</label>
                  <input
                    type="password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
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
                  {isLoading ? "Logging in..." : "Login"}
                </button>
              </form>
              <div className="text-center mt-6 pt-6 border-t border-border text-muted-foreground">
                <p>
                  Don't have an account?{" "}
                  <Link to="/register" className="text-primary font-medium">
                    Register here
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Admin Login */}
          {activeTab === "admin" && (
            <div className="p-8">
              <form onSubmit={handleAdminLogin}>
                <div className="mb-6">
                  <label className="block mb-2 text-muted-foreground text-sm font-medium">Username</label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Enter admin username"
                    required
                    className="w-full px-4 py-3 bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,215,0,0.1)] transition-all duration-300"
                  />
                </div>
                <div className="mb-6">
                  <label className="block mb-2 text-muted-foreground text-sm font-medium">Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
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
                  {isLoading ? "Logging in..." : "Admin Login"}
                </button>
              </form>
            </div>
          )}

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

export default Login;
