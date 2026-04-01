import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Search,
  Users,
  Stethoscope,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/library", label: "Library", icon: BookOpen },
  { path: "/lost-found", label: "Lost & Found", icon: Search },
  { path: "/clubs", label: "Clubs", icon: Users },
  { path: "/medical", label: "Medical", icon: Stethoscope },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside className="w-[280px] bg-primary text-primary-foreground flex flex-col fixed h-screen overflow-y-auto z-[100]" style={{ boxShadow: "2px 0 10px rgba(0,0,0,0.1)" }}>
      <div className="p-8 border-b border-primary-foreground/20">
        <h2 className="text-[1.8rem] font-bold text-accent tracking-wider">OmniCampus</h2>
        <p className="text-[0.8rem] text-primary-foreground/80 tracking-[2px] mt-1">CAMPUS MANAGEMENT</p>
      </div>
      <nav className="flex-1 py-6">
        <ul>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <li key={item.path} className="mb-1">
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-8 py-4 transition-all duration-300 ${
                    isActive
                      ? "bg-accent text-primary font-semibold border-l-[3px] border-primary-foreground"
                      : "text-primary-foreground/80 hover:bg-accent/20 hover:text-primary-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-8 border-t border-primary-foreground/20">
        <div className="text-primary-foreground text-sm">
          <p className="my-1">{profile?.full_name || "User"}</p>
          <p className="my-1 text-primary-foreground/60">Student ID: {profile?.student_id || "N/A"}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 mt-4 text-primary-foreground/80 hover:text-accent transition-colors duration-300"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
