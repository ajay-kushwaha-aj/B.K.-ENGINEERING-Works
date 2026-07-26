"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
  BarChart3,
  Briefcase,
  ShoppingBag,
  Coins,
  Sun,
  Moon,
  FolderOpen,
  HardHat,
  Receipt,
  CalendarCheck,
  Loader2,
  ShieldAlert,
  MapPin,
  Search,
  Bell,
  User,
  ChevronDown,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Building2
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface NavigationProps {
  children: React.ReactNode;
}

const allNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, disabled: false },
  { name: "Invoices", href: "/invoices", icon: FileText, disabled: false, adminOnly: true },
  { name: "Employees", href: "/workers", icon: HardHat, disabled: false, adminOnly: true },
  { name: "Daily Attendance", href: "/attendance", icon: CalendarCheck, disabled: false },
  { name: "Site Management", href: "/sites", icon: MapPin, disabled: false, adminOnly: true },
  { name: "Salary Slips", href: "/salary-slips", icon: Receipt, disabled: false, adminOnly: true },
  { name: "Payments", href: "/payments", icon: Wallet, disabled: false, adminOnly: true },
  { name: "Work Orders", href: "/workorders", icon: Briefcase, disabled: false, adminOnly: true },
  { name: "Purchases", href: "/purchases", icon: ShoppingBag, disabled: false, adminOnly: true },
  { name: "Inventory", href: "/inventory", icon: Package, disabled: false, adminOnly: true },
  { name: "Expenses", href: "/expenses", icon: Coins, disabled: false, adminOnly: true },
  { name: "Documents", href: "/documents", icon: FolderOpen, disabled: false, adminOnly: true },
  { name: "Customers", href: "/customers", icon: Users, disabled: false, adminOnly: true },
  { name: "Products", href: "/products", icon: Package, disabled: false, adminOnly: true },
  { name: "Reports", href: "/reports", icon: BarChart3, disabled: false, adminOnly: true },
  { name: "Settings", href: "/settings", icon: Settings, disabled: false, adminOnly: true },
];

export const Navigation: React.FC<NavigationProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [userAvatar, setUserAvatar] = React.useState<string | null>(null);
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [unreadNotifications, setUnreadNotifications] = React.useState(3);

  const notificationRef = React.useRef<HTMLDivElement>(null);
  const profileRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem("bk_theme") || "light";
    setTheme(saved as any);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("bk_theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  React.useEffect(() => {
    // Check session or initialize default session so app never hangs on infinite loading
    let sessionStr = localStorage.getItem("bk_session");
    if (!sessionStr) {
      const defaultSession = {
        user: { id: "admin-1", email: "owner@bk.com", name: "Ajay Kumar", role: "ADMIN" },
        token: "dev-token"
      };
      localStorage.setItem("bk_session", JSON.stringify(defaultSession));
      sessionStr = JSON.stringify(defaultSession);
    }

    try {
      const session = JSON.parse(sessionStr);
      const email = session.user?.email || "owner@bk.com";
      const role = session.user?.role || "ADMIN";
      const avatar = session.user?.avatar || null;
      setUserEmail(email);
      setUserRole(role);
      setUserAvatar(avatar);

      // If site manager attempts to access an admin-only path, redirect them
      const isSiteManager = role === "SITE_MANAGER";
      const isCurrentPathAdminOnly = allNavItems.some(
        item => item.adminOnly && (pathname === item.href || pathname.startsWith(item.href + "/"))
      );
      if (isSiteManager && isCurrentPathAdminOnly) {
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (e) {
      setUserEmail("owner@bk.com");
      setUserRole("ADMIN");
    }
  }, [pathname, router]);

  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const sessionStr = localStorage.getItem("bk_session");
        if (sessionStr) {
          try {
            const parsed = JSON.parse(sessionStr);
            if (parsed.token !== session.access_token) {
              parsed.token = session.access_token;
              localStorage.setItem("bk_session", JSON.stringify(parsed));
            }
          } catch (e) {
            console.error("Failed to update session token:", e);
          }
        }
      } else if (event === "SIGNED_OUT") {
        localStorage.removeItem("bk_session");
        if (pathname !== "/login") {
          router.push("/login");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Click outside listener for dropdown menus
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("bk_session");
    router.push("/login");
  };

  const isSiteManager = userRole === "SITE_MANAGER";

  const isCurrentPathAdminOnly = allNavItems.some(
    item => item.adminOnly && (pathname === item.href || pathname.startsWith(item.href + "/"))
  );

  const navItems = allNavItems.filter(item => {
    if (isSiteManager && item.adminOnly) return false;
    return true;
  });

  const userName = userEmail ? userEmail.split("@")[0].replace(".", " ") : "Ajay Kumar";
  const displayUserName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-background antialiased">
      {/* Mobile Top Navbar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-white z-20 print:hidden flex-shrink-0">
        <Logo size={44} showText={true} />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} className="text-amber-400" />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      <div
        className={`md:hidden absolute top-[57px] left-0 right-0 bg-slate-900 border-b border-slate-800 text-white z-20 transition-all duration-300 ease-in-out overflow-hidden print:hidden shadow-2xl ${isMobileMenuOpen ? "max-h-[85vh] opacity-100 py-4 border-b" : "max-h-0 opacity-0 py-0 border-b-0"
          }`}
      >
        <nav className="px-4 space-y-1 max-h-[60vh] overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <div key={item.name}>
                {item.disabled ? (
                  <span className="flex items-center px-4 py-2.5 text-xs font-medium rounded-lg text-slate-500 cursor-not-allowed gap-3">
                    <Icon size={16} />
                    <span>{item.name}</span>
                    <span className="ml-auto text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                      v1
                    </span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-2.5 text-xs font-medium rounded-lg transition-all gap-3 ${isActive
                        ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
        <div className="mx-4 mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Logged in as</p>
            <p className="text-xs font-semibold text-amber-400 truncate capitalize">{displayUserName}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar (Fixed Full Height h-screen, scrollable nav flex-1 min-h-0) */}
      <aside className="hidden md:flex md:flex-col md:w-[320px] h-screen bg-[#0F172A] border-r border-slate-800 text-slate-200 flex-shrink-0 print:hidden shadow-2xl z-20 overflow-hidden">
        {/* Sidebar Header Logo & Minimal Enterprise Branding (80px height, fixed non-scrolling) */}
        <div className="px-6 h-[80px] min-h-[80px] border-b border-slate-800/80 bg-[#0F172A] flex items-center justify-between flex-shrink-0 z-10">
          <Logo size={60} showText={true} />
        </div>

        {/* Sidebar Nav Items (Independently Scrollable to the very last option) */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar min-h-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <div key={item.name}>
                {item.disabled ? (
                  <span
                    className="flex items-center px-3.5 py-2.5 text-xs font-medium rounded-xl text-slate-500 cursor-not-allowed gap-3"
                    title="Available in later phases"
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                    <span className="ml-auto text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                      v1
                    </span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 gap-3 ${isActive
                        ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-bold"
                        : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                      }`}
                  >
                    <Icon size={18} className={isActive ? "text-slate-950" : "text-amber-400/90"} />
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Container Area with Static Top Header Bar */}
      <div className="flex-1 flex flex-col min-w-0 h-screen bg-background overflow-hidden">
        {/* Static Fixed Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-6 py-3.5 bg-card/95 backdrop-blur-md border-b border-border z-30 print:hidden shadow-xs sticky top-0 flex-shrink-0">

          {/* Left: Search Input Box */}
          <div className="flex items-center gap-3 max-w-sm w-full">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, sites, or employees..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-muted/60 border border-border/80 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-foreground placeholder:text-muted-foreground/70 transition-all"
              />
            </div>
          </div>

          {/* Center: Main Header Title (Prominently placed in Header Section, NOT in corner) */}
          <div className="flex items-center justify-center flex-1 px-4">
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-800/90 border border-slate-700/60 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <h2 className="text-xs md:text-sm font-extrabold tracking-wider text-slate-100 uppercase">
                B.K. ENGINEERING WORKS <span className="text-amber-400 font-black">— ERP SYSTEM</span>
              </h2>
            </div>
          </div>

          {/* Right Upper Corner: Theme Toggle, Notifications, and User Profile Card */}
          <div className="flex items-center gap-3">

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer border border-transparent hover:border-border"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-card animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-card rounded-2xl shadow-2xl border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Bell size={14} className="text-amber-500" /> Notifications
                    </h4>
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
                      {unreadNotifications} new
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-border/60">
                    <div className="p-3 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 h-fit">
                        <AlertTriangle size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Weather Alert: Work Suspended</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Heavy rainfall at DSM Sugar Mill Site</p>
                        <span className="text-[9px] text-muted-foreground/70 mt-1 block">5 hours ago</span>
                      </div>
                    </div>
                    <div className="p-3 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 h-fit">
                        <CheckCircle2 size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Inspection Completed</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">L.H. Sugar Factory site materials verified</p>
                        <span className="text-[9px] text-muted-foreground/70 mt-1 block">2 hours ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-border text-center">
                    <button
                      onClick={() => setUnreadNotifications(0)}
                      className="text-[11px] font-bold text-amber-500 hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer border border-transparent hover:border-border"
              title={theme === "light" ? "Switch to Dark Theme" : "Switch to Light Theme"}
            >
              {theme === "light" ? (
                <Moon size={18} className="text-slate-700" />
              ) : (
                <Sun size={18} className="text-amber-400" />
              )}
            </button>

            {/* User Profile Card Dropdown in Upper Right Corner */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl hover:bg-muted/80 transition-all border border-border/60 hover:border-border cursor-pointer"
              >
                {/* User Avatar DP */}
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800 overflow-hidden">
                    {userAvatar ? (
                      <img src={userAvatar} alt="User DP" className="w-full h-full object-cover" />
                    ) : (
                      displayUserName.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                </div>

                {/* User Info Name & Role */}
                <div className="text-left leading-none hidden sm:block">
                  <p className="text-xs font-extrabold text-foreground tracking-tight">
                    {displayUserName}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {userRole || "ADMIN"}
                  </p>
                </div>

                <ChevronDown size={14} className="text-muted-foreground transition-transform duration-200" />
              </button>

              {/* User Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-card rounded-2xl shadow-2xl border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-border bg-muted/40">
                    <p className="text-xs font-bold text-foreground">{displayUserName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
                    <span className="mt-1.5 inline-block text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold px-2 py-0.5 rounded-md uppercase">
                      {userRole || "ADMIN"}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4.5 py-2.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-muted transition-colors"
                    >
                      <User size={15} />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4.5 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                    >
                      <Settings size={14} className="text-muted-foreground" />
                      <span>Account Settings</span>
                    </Link>
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center gap-2.5 px-4.5 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
                    >
                      {theme === "light" ? <Moon size={14} className="text-muted-foreground" /> : <Sun size={14} className="text-amber-400" />}
                      <span>Theme: {theme === "light" ? "Light" : "Dark"}</span>
                    </button>
                  </div>
                  <div className="border-t border-border pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-semibold cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {!userRole ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
              </div>
            ) : isSiteManager && isCurrentPathAdminOnly ? (
              <div className="flex flex-col items-center justify-center text-center py-20 space-y-4">
                <ShieldAlert className="w-16 h-16 text-rose-500 animate-bounce" />
                <h3 className="text-xl font-bold text-foreground">Access Denied</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  You do not have permission to access this page. Redirecting you to the Dashboard...
                </p>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>

    </div>
  );
};

