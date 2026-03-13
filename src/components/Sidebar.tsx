import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  Settings, 
  Menu, 
  ChevronLeft,
  ChevronRight,
  Box,
  DollarSign,
  Mail,
  LogOut,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setIsCollapsed(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/orders", label: "Orders", icon: ShoppingCart },
    { href: "/inventory", label: "Inventory", icon: Box },
    { href: "/products", label: "Products", icon: Package },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/receivables", label: "Receivables", icon: DollarSign },
    { href: "/emails", label: "Emails", icon: Mail },
    { href: "/tasks", label: "Tasks & Deliveries", icon: ClipboardList },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div 
      className={cn(
        "relative flex flex-col border-r border-amber-200 bg-amber-50/50 min-h-screen transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-amber-200">
        {!isCollapsed && (
          <div className="font-bold text-xl text-amber-900 truncate">
            Satmar Matzos
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href || (item.href !== "/" && router.pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive 
                    ? "bg-amber-200 text-amber-900 font-medium" 
                    : "text-gray-600 hover:bg-amber-100 hover:text-amber-900",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-amber-700")} />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {!isCollapsed && user && (
        <div className="p-4 border-t border-amber-200">
          <div className="mb-2">
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-gray-600 hover:text-amber-900 hover:bg-amber-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}

      {isCollapsed && user && (
        <div className="p-2 border-t border-amber-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="w-full text-gray-600 hover:text-amber-900 hover:bg-amber-100"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}