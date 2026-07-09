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
  ClipboardList,
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
} from "lucide-react";


interface NavigationProps {
  children: React.ReactNode;
}

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
        setUserEmail(session.user?.email || "owner@bk.com");
        setUserRole(session.user?.role || "ADMIN");
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

  const handleLogout = () => {
    localStorage.removeItem("bk_session");
    router.push("/login");
  };

  const isSiteManager = userRole === "SITE_MANAGER";

  const allNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, disabled: false },
    { name: "Invoices", href: "/invoices", icon: FileText, disabled: false, adminOnly: true },
    { name: "Workers", href: "/workers", icon: HardHat, disabled: false, adminOnly: true },
    { name: "Daily Attendance", href: "/attendance", icon: CalendarCheck, disabled: false },
    { name: "Salary Slips", href: "/salary-slips", icon: Receipt, disabled: false, adminOnly: true },
    { name: "Quotations", href: "/quotations", icon: ClipboardList, disabled: false, adminOnly: true },
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

  const navItems = allNavItems.filter(item => {
    if (isSiteManager && item.adminOnly) return false;
    return true;
  });


  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Top Navbar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-white z-20 print:hidden">
        <Logo size={48} showText={true} />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-30 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <aside
        className={`md:hidden fixed top-0 bottom-0 left-0 w-64 bg-slate-900 border-r border-slate-800 text-white z-40 transform transition-transform duration-300 ease-in-out print:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <Logo size={48} showText={true} />
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <div key={item.name}>
                {item.disabled ? (
                  <span className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-500 cursor-not-allowed gap-3">
                    <Icon size={18} />
                    <span>{item.name}</span>
                    <span className="ml-auto text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                      v1
                    </span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all gap-3 ${
                      isActive
                        ? "bg-secondary text-slate-900 font-bold"
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

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-slate-900 border-r border-slate-800 text-white flex-shrink-0 print:hidden">
        <div className="p-6 border-b border-slate-800">
          <Logo size={52} showText={true} />
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
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Alternative Quick Access) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 text-white flex items-center justify-around z-20 px-2 pb-safe shadow-lg print:hidden">
        {navItems.filter(item => !item.disabled || item.href === "/settings").map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.disabled ? "#" : item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 ${
                item.disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
              } ${isActive ? "text-secondary" : "text-slate-400 hover:text-white"}`}
            >
              <Icon size={20} className={isActive ? "scale-110 transition-transform" : ""} />
              <span className="text-[10px] mt-1 font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      {/* Mobile spacing helper so bottom nav doesn't cover content */}
      <div className="md:hidden h-16 w-full flex-shrink-0 print:hidden" />
    </div>
  );
};
