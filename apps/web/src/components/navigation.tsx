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
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

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
    // Check session
    const sessionStr = localStorage.getItem("bk_session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        const email = session.user?.email || "owner@bk.com";
        const role = session.user?.role || "ADMIN";
        setUserEmail(email);
        setUserRole(role);

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
    } else {
      // If no session, redirect to login (unless we are already there)
      if (pathname !== "/login") {
        router.push("/login");
      }
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


  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Top Navbar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-white z-20 print:hidden">
        <Logo size={56} showText={true} />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Dropdown Menu (Slides Up/Down) */}
      <div
        className={`md:hidden absolute top-[57px] left-0 right-0 bg-slate-900 border-b border-slate-800 text-white z-20 transition-all duration-300 ease-in-out overflow-hidden print:hidden shadow-lg ${
          isMobileMenuOpen ? "max-h-[85vh] opacity-100 py-4 border-b" : "max-h-0 opacity-0 py-0 border-b-0"
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
                    className={`flex items-center px-4 py-2.5 text-xs font-medium rounded-lg transition-all gap-3 ${
                      isActive
                        ? "bg-secondary text-slate-900 font-bold"
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
            <p className="text-[10px] text-slate-400">Signed in as</p>
            <p className="text-xs font-semibold text-slate-200 truncate">{userEmail}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-slate-900 border-r border-slate-800 text-white flex-shrink-0 print:hidden">
        <div className="p-6 border-b border-slate-800">
          <Logo size={68} showText={true} />
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <div key={item.name}>
                {item.disabled ? (
                  <span
                    className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-500 cursor-not-allowed gap-3"
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
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all gap-3 ${
                      isActive
                        ? "bg-secondary text-slate-900 font-bold shadow-md shadow-amber-500/10"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs text-slate-400">Signed in as</p>
            <p className="text-xs font-semibold text-slate-200 truncate">{userEmail}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto">
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {!userRole ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          ) : isSiteManager && isCurrentPathAdminOnly ? (
            <div className="flex flex-col items-center justify-center text-center py-20 space-y-4">
              <ShieldAlert className="w-16 h-16 text-danger animate-bounce" />
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
  );
};
