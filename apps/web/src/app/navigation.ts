import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Plug,
  Settings,
} from "lucide-react";

export const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/daily-profit", label: "Daily Profit", icon: TrendingUp },
  { to: "/products", label: "Products", icon: Package },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;
