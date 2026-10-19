import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Tag,
  Truck,
  Users,
} from "lucide-react";

export const navigationItems = Object.freeze([
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "checkout", label: "Point of Sale", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "stock-report", label: "Stock Report", icon: BarChart3 },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "sales", label: "Sales", icon: ClipboardList },
  { id: "settings", label: "Settings", icon: Settings },
]);
