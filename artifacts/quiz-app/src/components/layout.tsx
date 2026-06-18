import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Settings, LayoutDashboard, Database, Menu, X } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Content", href: "/content", icon: Database },
  { name: "Generator", href: "/generate", icon: BookOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

function NavLinks({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  return (
    <>
      {navigation.map((item) => {
        const isActive = location === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <item.icon size={18} />
            {item.name}
          </Link>
        );
      })}
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <BookOpen size={18} />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground">QuizGen AI</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <NavLinks location={location} />
        </nav>
        <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground">
          <p>AI Quiz Generator &copy; {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 left-0 h-full z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col md:hidden transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <BookOpen size={18} />
            </div>
            <span className="font-bold text-lg text-sidebar-foreground">QuizGen AI</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <NavLinks location={location} onNavigate={() => setMobileOpen(false)} />
        </nav>
        <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground">
          <p>AI Quiz Generator &copy; {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-foreground p-1 rounded-md hover:bg-accent"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground">
              <BookOpen size={13} />
            </div>
            <span className="font-bold text-base">QuizGen AI</span>
          </div>
          <span className="ml-auto text-sm text-muted-foreground font-medium">
            {navigation.find((n) => n.href === location)?.name ?? ""}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
