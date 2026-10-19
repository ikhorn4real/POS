import {
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Building2,
  Boxes,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Command,
  Copy,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Printer,
  RefreshCw,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Minus,
  Pencil,
  Plus,
  PackagePlus,
  Pause,
  Play,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatGhs, minorUnits } from "@counterpoint/shared/money";
import { AccessibleDialog, ProductArtwork } from "./components/Common.jsx";
import { NotificationCenter } from "./components/NotificationCenter.jsx";
import { DashboardInventoryWatch } from "./components/Dashboard.jsx";
import {
  buildDemoDashboardInsights,
  buildInventoryNotifications,
  fillSalesTrend,
  findExpiringProducts,
  lastDayKeys,
} from "./dashboard-model.js";
import { requestApi } from "./shared/api-client.js";
import { getVisiblePages } from "./app/permissions.js";
import { navigationItems } from "./app/navigation.js";
import { changePassword, getSession, signIn, signOut as signOutSession } from "./features/auth/auth-api.js";
import { AuthGate } from "./features/auth/AuthGate.jsx";
import { saleUnitPriceCents } from "./features/checkout/pricing.js";
import { addCartItem, changeCartQuantity, removeCartItem, summarizeCart } from "./features/checkout/cart-model.js";
import { CheckoutCatalog } from "./features/checkout/CheckoutCatalog.jsx";
import { CheckoutCustomerPicker } from "./features/checkout/CheckoutCustomerPicker.jsx";
import { quoteSale, submitCashSale } from "./features/checkout/checkout-api.js";
import { filterInventory, getStockHealth, validateStockAdjustment } from "./features/inventory/inventory-model.js";
import { adjustProductStock, createProduct, getInventoryReport, listProducts, updateProduct } from "./features/inventory/inventory-api.js";
import { InventoryTable } from "./features/inventory/InventoryTable.jsx";
import { ProductFormDialog } from "./features/inventory/ProductFormDialog.jsx";
import { listSales, getSale, getSalesSummary } from "./features/sales/sales-api.js";
import { filterDemoSales, paginate } from "./features/sales/sales-model.js";
import { SalesPage } from "./features/sales/SalesPage.jsx";
import { listCustomers, createCustomer, updateCustomer, getCustomerHistory } from "./features/customers/customers-api.js";
import { filterCustomers } from "./features/customers/customers-model.js";
import { CustomersPage } from "./features/customers/CustomersPage.jsx";
import { CustomerHistoryPage } from "./features/customers/CustomerHistoryPage.jsx";
import { SuppliersPage } from "./features/suppliers/SuppliersPage.jsx";
import { CategoriesPage } from "./features/catalog/CategoriesPage.jsx";
import { listSuppliers, createSupplier as createSupplierRequest, updateSupplier } from "./features/suppliers/suppliers-api.js";
import { listCategories, createCategory as createCategoryRequest, updateCategory } from "./features/catalog/categories-api.js";
import { TeamPage } from "./features/team/TeamPage.jsx";
import { listTeamMembers, createTeamMember as createTeamMemberRequest, updateTeamMember as updateTeamMemberRequest, resetTeamMemberPassword as resetTeamMemberPasswordRequest } from "./features/team/team-api.js";
import { listStores, saveStore } from "./features/stores/stores-api.js";
import { StoresPage } from "./features/stores/StoresPage.jsx";
import { SalesTrendChart } from "./features/dashboard/SalesTrendChart.jsx";
import "./POS.css";
import "./modern-ui.css";
import "./features/checkout/checkout.css";

const initialSuppliers = [
  {
    id: 1,
    name: "GlowLab Wholesale",
    contactName: "Ama Nyarko",
    email: "orders@glowlab.example",
    phone: "+233 30 555 0301",
  },
  {
    id: 2,
    name: "Botanica Beauty Supply",
    contactName: "Esi Agyeman",
    email: "hello@botanicabeauty.example",
    phone: "+233 24 555 0302",
  },
  {
    id: 3,
    name: "PureFormulations Ghana",
    contactName: "Kojo Tetteh",
    email: "sales@pureformulations.example",
    phone: "+233 20 555 0303",
  },
];

const initialProducts = [
  {
    id: 1,
    name: "Daily Glow Facial Cleanser",
    sku: "SK-1001",
    category: "Skincare",
    price: 85,
    costPrice: 42,
    wholesalePrice: 68,
    wholesaleQuantity: 6,
    stock: 24,
    reorderLevel: 6,
    supplier: initialSuppliers[0].name,
    supplierId: 1,
    expiryDate: "2027-06-30",
    color: "#f7ded5",
    initials: "GC",
    productionDescription:
      "Gentle gel cleanser with aloe and vitamin B5, 150 ml.",
    mftDate: "2025-06-30",
  },
  {
    id: 2,
    name: "Vitamin C Brightening Serum",
    sku: "SK-1002",
    category: "Skincare",
    price: 145,
    costPrice: 76,
    wholesalePrice: 118,
    wholesaleQuantity: 6,
    stock: 18,
    reorderLevel: 5,
    supplier: initialSuppliers[0].name,
    supplierId: 1,
    expiryDate: "2027-03-31",
    color: "#f8edc8",
    initials: "VC",
    productionDescription:
      "Brightening serum with vitamin C and hyaluronic acid, 30 ml.",
    mftDate: "2025-03-31",
  },
  {
    id: 3,
    name: "Shea Butter Body Cream",
    sku: "BD-1003",
    category: "Body Care",
    price: 95,
    costPrice: 44,
    wholesalePrice: 75,
    wholesaleQuantity: 6,
    stock: 30,
    reorderLevel: 8,
    supplier: initialSuppliers[1].name,
    supplierId: 2,
    expiryDate: "2027-11-30",
    color: "#ead8bd",
    initials: "SB",
    productionDescription: "Rich whipped shea body cream, unscented, 250 ml.",
    mftDate: "2025-11-30",
  },
  {
    id: 4,
    name: "Cocoa Vanilla Body Oil",
    sku: "BD-1004",
    category: "Body Care",
    price: 110,
    costPrice: 53,
    wholesalePrice: 88,
    wholesaleQuantity: 6,
    stock: 5,
    reorderLevel: 6,
    supplier: initialSuppliers[1].name,
    supplierId: 2,
    expiryDate: "2027-08-31",
    color: "#f1dfc8",
    initials: "CO",
    productionDescription: "Nourishing cocoa and vanilla body oil, 100 ml.",
    mftDate: "2025-08-31",
  },
  {
    id: 5,
    name: "Velvet Matte Lipstick — Rose",
    sku: "MK-1005",
    category: "Makeup",
    price: 78,
    costPrice: 32,
    wholesalePrice: 60,
    wholesaleQuantity: 6,
    stock: 20,
    reorderLevel: 5,
    supplier: initialSuppliers[2].name,
    supplierId: 3,
    expiryDate: "2028-02-28",
    color: "#f0d2d8",
    initials: "VL",
    productionDescription: "Long-wear velvet matte lipstick in Rose, 4 g.",
    mftDate: "2025-02-28",
  },
  {
    id: 6,
    name: "Everyday SPF 50 Sunscreen",
    sku: "SK-1006",
    category: "Sun Care",
    price: 125,
    costPrice: 61,
    wholesalePrice: 98,
    wholesaleQuantity: 6,
    stock: 16,
    reorderLevel: 5,
    supplier: initialSuppliers[2].name,
    supplierId: 3,
    expiryDate: "2027-09-30",
    color: "#f5e8bf",
    initials: "SP",
    productionDescription: "Broad-spectrum SPF 50 face sunscreen, 50 ml.",
    mftDate: "2025-09-30",
  },
  {
    id: 7,
    name: "Hydrating Sheet Mask",
    sku: "SK-1007",
    category: "Skincare",
    price: 25,
    costPrice: 9,
    wholesalePrice: 18,
    wholesaleQuantity: 12,
    stock: 42,
    reorderLevel: 12,
    supplier: initialSuppliers[0].name,
    supplierId: 1,
    expiryDate: "2027-05-31",
    color: "#dcece4",
    initials: "HM",
    productionDescription:
      "Single-use hydrating sheet mask with cucumber extract.",
    mftDate: "2025-05-31",
  },
  {
    id: 8,
    name: "Gentle Oat Face Moisturizer",
    sku: "SK-1008",
    category: "Skincare",
    price: 115,
    costPrice: 55,
    wholesalePrice: 92,
    wholesaleQuantity: 6,
    stock: 0,
    reorderLevel: 5,
    supplier: initialSuppliers[1].name,
    supplierId: 2,
    expiryDate: "2027-12-31",
    color: "#e4e2f5",
    initials: "OM",
    productionDescription:
      "Fragrance-free oat moisturizer for sensitive skin, 50 ml.",
    mftDate: "2025-12-31",
  },
];

const initialCategories = [
  ...new Set(initialProducts.map((product) => product.category)),
]
  .sort((a, b) => a.localeCompare(b))
  .map((name, index) => ({ id: index + 1, name }));

const initialCustomers = [
  {
    id: 1,
    name: "Adwoa Serwaa",
    phone: "+233 24 555 0401",
    email: "adwoa.serwaa@example.com",
    notes: "Sensitive skin; prefers fragrance-free products.",
  },
  {
    id: 2,
    name: "Mabel Quartey",
    phone: "+233 55 555 0402",
    email: "mabel.quartey@example.com",
    notes: "Regular skincare customer.",
  },
  {
    id: 3,
    name: "Efua Owusu",
    phone: "+233 20 555 0403",
    email: "efua.owusu@example.com",
    notes: "",
  },
];
const initialDemoStore = {
  id: 1,
  name: "Glow & Grace Cosmetics",
  branch: "Accra Central",
  manager: "Demo Owner",
  location: "Osu, Accra",
  phone: "+233 30 555 0400",
  email: "hello@glowandgrace.example",
  active: true,
};

function storeLabel(store) {
  return store.branch ? `${store.name} — ${store.branch}` : store.name;
}

function generateTemporaryPassword() {
  const characterGroups = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#$%*-_",
  ];
  const alphabet = characterGroups.join("");
  const randomIndex = (length) =>
    globalThis.crypto.getRandomValues(new Uint32Array(1))[0] % length;
  const characters = characterGroups.map(
    (group) => group[randomIndex(group.length)],
  );
  while (characters.length < 16) {
    characters.push(alphabet[randomIndex(alphabet.length)]);
  }
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ];
  }
  return characters.join("");
}

const initialSales = [
  {
    id: "GG-2002",
    items: 3,
    total: 240,
    date: Date.now() - 1000 * 60 * 28,
    method: "Cash",
    cashierId: "demo-owner",
    cashierName: "Demo Owner",
    customerId: 1,
    customerName: "Adwoa Serwaa",
    subtotal: 240,
    cashReceived: 250,
    change: 10,
    itemsDetail: [
      {
        productName: "Daily Glow Facial Cleanser",
        quantity: 1,
        unitPrice: 85,
        lineTotal: 85,
      },
      {
        productName: "Vitamin C Brightening Serum",
        quantity: 1,
        unitPrice: 130.5,
        lineTotal: 130.5,
      },
      {
        productName: "Hydrating Sheet Mask",
        quantity: 1,
        unitPrice: 24.5,
        lineTotal: 24.5,
      },
    ],
  },
  {
    id: "GG-2001",
    items: 2,
    total: 220,
    date: Date.now() - 1000 * 60 * 60 * 3,
    method: "Mobile Money",
    cashierId: "demo-owner",
    cashierName: "Demo Owner",
    customerId: 2,
    customerName: "Mabel Quartey",
    subtotal: 220,
    cashReceived: null,
    change: 0,
    itemsDetail: [
      {
        productName: "Shea Butter Body Cream",
        quantity: 1,
        unitPrice: 95,
        lineTotal: 95,
      },
      {
        productName: "Everyday SPF 50 Sunscreen",
        quantity: 1,
        unitPrice: 125,
        lineTotal: 125,
      },
    ],
  },
];

const DEMO_DATA_VERSION = "cosmetics-v1";

function ensureCurrentDemoData() {
  if (
    localStorage.getItem("counterpoint-demo-data-version") === DEMO_DATA_VERSION
  )
    return;
  [
    "products",
    "sales",
    "team",
    "suppliers",
    "categories",
    "customers",
    "stock-movements",
  ].forEach((key) => {
    localStorage.removeItem(`counterpoint-demo-${key}`);
    localStorage.removeItem(`counterpoint-${key}`);
  });
  localStorage.removeItem("counterpoint-held-orders-demo-owner");
  localStorage.setItem("counterpoint-demo-data-version", DEMO_DATA_VERSION);
}

function readDemoSaved(key, fallback) {
  try {
    ensureCurrentDemoData();
    const saved =
      localStorage.getItem(`counterpoint-demo-${key}`) ??
      localStorage.getItem(`counterpoint-${key}`);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error(`Could not load demo ${key}.`, error);
    return fallback;
  }
}

function normalizeProduct(product, index) {
  const legacySku = `CP-${String(product.id ?? index + 1)
    .slice(-6)
    .padStart(6, "0")}`;
  const sampleDefaults = initialProducts.find(
    (sample) => sample.id === product.id,
  );
  const hasLegacyMetadata = !product.sku || product.sku === legacySku;
  return {
    ...product,
    sku: hasLegacyMetadata ? (sampleDefaults?.sku ?? legacySku) : product.sku,
    costPrice: hasLegacyMetadata
      ? (sampleDefaults?.costPrice ?? product.costPrice ?? 0)
      : (product.costPrice ?? 0),
    wholesalePrice: hasLegacyMetadata
      ? (sampleDefaults?.wholesalePrice ?? product.wholesalePrice ?? 0)
      : (product.wholesalePrice ?? 0),
    wholesaleQuantity:
      product.wholesaleQuantity ?? sampleDefaults?.wholesaleQuantity ?? 0,
    reorderLevel: hasLegacyMetadata
      ? (sampleDefaults?.reorderLevel ?? product.reorderLevel ?? 5)
      : (product.reorderLevel ?? 5),
    supplier: product.supplier ?? sampleDefaults?.supplier ?? "",
    supplierId:
      product.supplierId ??
      initialSuppliers.find(
        (supplier) =>
          supplier.name === (product.supplier ?? sampleDefaults?.supplier),
      )?.id ??
      null,
    expiryDate: product.expiryDate ?? "",
    productionDescription: product.productionDescription ?? "",
    mftDate: product.mftDate ?? "",
  };
}

function makeDemoReport(products, movements, expiringWithinDays = 30) {
  const today = new Date().toISOString().slice(0, 10);
  const expiryLimit = new Date(Date.now() + expiringWithinDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const lowStock = products.filter(
    (product) => product.stock <= product.reorderLevel,
  );
  const expiring = products.filter(
    (product) => product.expiryDate && product.expiryDate <= expiryLimit,
  );
  return {
    generatedAt: Date.now(),
    expiringWithinDays,
    summary: {
      productCount: products.length,
      totalUnits: products.reduce((sum, product) => sum + product.stock, 0),
      lowStockCount: products.filter(
        (product) => product.stock > 0 && product.stock <= product.reorderLevel,
      ).length,
      outOfStockCount: products.filter((product) => product.stock === 0).length,
      expiredCount: products.filter(
        (product) => product.expiryDate && product.expiryDate < today,
      ).length,
      expiringSoonCount: products.filter(
        (product) =>
          product.expiryDate &&
          product.expiryDate >= today &&
          product.expiryDate <= expiryLimit,
      ).length,
      costValue: products.reduce(
        (sum, product) => sum + product.costPrice * product.stock,
        0,
      ),
      retailValue: products.reduce(
        (sum, product) => sum + product.price * product.stock,
        0,
      ),
    },
    lowStock,
    expiring,
    movements,
  };
}

function money(value) {
  // API summary values are GHS decimals; this conversion is for display only.
  return formatGhs(minorUnits(Math.round(value * 100)));
}

function localDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentTimestamp() {
  return Date.now();
}

function localSalesSummaryRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function localDashboardRange(dayCount = 7, customRange = null) {
  if (customRange?.start && customRange?.end) {
    const start = new Date(`${customRange.start}T00:00:00`);
    const end = new Date(`${customRange.end}T00:00:00`);
    end.setDate(end.getDate() + 1);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (dayCount - 1));
  const end = new Date(start);
  end.setDate(end.getDate() + dayCount);
  return { start: start.toISOString(), end: end.toISOString() };
}

function dashboardRangeKeys(range) {
  if (!range?.start || !range?.end) return lastDayKeys();
  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T00:00:00`);
  const days = [];
  for (const cursor = new Date(start); cursor <= end && days.length < 31; cursor.setDate(cursor.getDate() + 1)) {
    days.push(localDateKey(cursor));
  }
  return days;
}

function dashboardPresetRange(preset, now = new Date()) {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  if (preset === "Yesterday") start.setDate(start.getDate() - 1), end.setDate(end.getDate() - 1);
  else if (preset === "Last 7 days") start.setDate(start.getDate() - 6);
  else if (preset === "Last 30 days") start.setDate(start.getDate() - 29);
  else if (preset === "This month") start.setDate(1);
  else if (preset === "Last month") {
    start.setDate(1);
    start.setMonth(start.getMonth() - 1);
    end.setDate(0);
  } else if (preset === "This year") {
    start.setMonth(0, 1);
  }
  return { start: localDateKey(start), end: localDateKey(end) };
}

function dashboardCalendarDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return { date, key: localDateKey(date), inMonth: date.getMonth() === month.getMonth() };
  });
}

function amountCents(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0
    ? Math.round(amount * 100)
    : null;
}

function heldOrderId() {
  return globalThis.crypto.randomUUID();
}

function readHeldOrders(userId) {
  const saved = localStorage.getItem(`counterpoint-held-orders-${userId}`);
  if (!saved) return {};
  try {
    const orders = JSON.parse(saved);
    if (!orders || typeof orders !== "object" || Array.isArray(orders)) {
      throw new Error("Held orders have an invalid format.");
    }
    return orders;
  } catch (error) {
    console.error("Could not load held orders.", error);
    return {};
  }
}

function timeLabel(timestamp) {
  return new Intl.DateTimeFormat("en-GH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function POS() {
  const [mode, setMode] = useState(() =>
    localStorage.getItem("counterpoint-demo-mode") === "true"
      ? "demo"
      : "loading",
  );
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState(() =>
    localStorage.getItem("counterpoint-demo-mode") === "true"
      ? {
          id: "demo-owner",
          name: "Demo Owner",
          email: "demo@counterpoint.local",
          role: "owner",
        }
      : null,
  );
  const [loginBusy, setLoginBusy] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [products, setProducts] = useState(() =>
    localStorage.getItem("counterpoint-demo-mode") === "true"
      ? readDemoSaved("products", initialProducts).map(normalizeProduct)
      : [],
  );
  const [sales, setSales] = useState(() =>
    localStorage.getItem("counterpoint-demo-mode") === "true"
      ? readDemoSaved("sales", initialSales)
      : [],
  );
  const [team, setTeam] = useState(() =>
    localStorage.getItem("counterpoint-demo-mode") === "true"
      ? readDemoSaved("team", [])
      : [],
  );
  const [stores, setStores] = useState(() =>
    localStorage.getItem("counterpoint-demo-mode") === "true"
      ? [initialDemoStore]
      : [],
  );
  const [managementStores, setManagementStores] = useState(() =>
    localStorage.getItem("counterpoint-demo-mode") === "true"
      ? [initialDemoStore]
      : [],
  );
  const [activeStoreId, setActiveStoreId] = useState(() =>
    localStorage.getItem("counterpoint-demo-mode") === "true" ? "1" : "",
  );
  const [suppliers, setSuppliers] = useState(() =>
    localStorage.getItem("counterpoint-demo-mode") === "true"
      ? readDemoSaved("suppliers", initialSuppliers)
      : [],
  );
  const [inventoryCategories, setInventoryCategories] = useState(() =>
    localStorage.getItem("counterpoint-demo-mode") === "true"
      ? readDemoSaved("categories", initialCategories)
      : [],
  );
  const [customers, setCustomers] = useState(() =>
    localStorage.getItem("counterpoint-demo-mode") === "true"
      ? readDemoSaved("customers", initialCustomers)
      : [],
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [page, setPage] = useState("overview");
  const [settingsSection, setSettingsSection] = useState("stores");
  const [cart, setCart] = useState([]);
  const [quoteReview, setQuoteReview] = useState(null);
  const [mobileCartExpanded, setMobileCartExpanded] = useState(false);
  const [heldOrdersByStore, setHeldOrdersByStore] = useState(() =>
    localStorage.getItem("counterpoint-demo-mode") === "true"
      ? readHeldOrders("demo-owner")
      : {},
  );
  const [query, setQuery] = useState("");
  const [inventoryQuery, setInventoryQuery] = useState("");
  const [inventoryLowStockOnly, setInventoryLowStockOnly] = useState(false);
  const [transactionQuery, setTransactionQuery] = useState("");
  const [salesPage, setSalesPage] = useState(1);
  const [salesDateFrom, setSalesDateFrom] = useState("");
  const [salesDateTo, setSalesDateTo] = useState("");
  const [salesTotalCount, setSalesTotalCount] = useState(0);
  const [salesSummary, setSalesSummary] = useState(null);
  const [dashboardInsights, setDashboardInsights] = useState({
    trend: [],
    bestSellers: [],
    payments: [],
  });
  const [dashboardPeriod, setDashboardPeriod] = useState(7);
  const [dashboardChartMode, setDashboardChartMode] = useState("revenue");
  const [dashboardSalesQuery, setDashboardSalesQuery] = useState("");
  const [dashboardCustomRange, setDashboardCustomRange] = useState(null);
  const [dashboardCustomDraft, setDashboardCustomDraft] = useState(() => {
    const today = localDateKey(new Date());
    const start = new Date(`${today}T00:00:00`);
    start.setDate(start.getDate() - 6);
    return { start: localDateKey(start), end: today };
  });
  const [dashboardCustomOpen, setDashboardCustomOpen] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockReport, setStockReport] = useState(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [stockMovements, setStockMovements] = useState(() =>
    readDemoSaved("stock-movements", []),
  );
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [createdCredential, setCreatedCredential] = useState(null);
  const [teamActionBusyId, setTeamActionBusyId] = useState("");
  const [showHeaderAccountMenu, setShowHeaderAccountMenu] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showPasswordChangeFields, setShowPasswordChangeFields] =
    useState(false);
  const [passwordChangeBusy, setPasswordChangeBusy] = useState(false);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomerHistory, setViewingCustomerHistory] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [customerHistoryPage, setCustomerHistoryPage] = useState(1);
  const [customerHistoryTotal, setCustomerHistoryTotal] = useState(0);
  const [customerHistoryBusy, setCustomerHistoryBusy] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [saleBusy, setSaleBusy] = useState(false);
  const saleSubmissionLock = useRef(false);
  const saleIdempotencyRef = useRef(null);
  const cartPanelRef = useRef(null);
  const productSearchRef = useRef(null);
  const [cashReceived, setCashReceived] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [receiptBusyId, setReceiptBusyId] = useState("");
  const [toast, setToast] = useState("");
  const inventoryProductsRef = useRef(null);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const focusProductSearch = (event) => {
      if (
        !["authenticated", "demo"].includes(mode) ||
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "k" ||
        document.querySelector('[role="dialog"][aria-modal="true"]')
      ) {
        return;
      }
      event.preventDefault();
      if (page !== "checkout") goToPage("checkout");
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => productSearchRef.current?.focus()),
      );
    };
    window.addEventListener("keydown", focusProductSearch);
    return () => window.removeEventListener("keydown", focusProductSearch);
  }, [mode, page]);

  useEffect(() => {
    if (mode !== "demo") return;
    localStorage.setItem(
      "counterpoint-demo-products",
      JSON.stringify(products),
    );
  }, [mode, products]);

  useEffect(() => {
    if (mode !== "demo") return;
    localStorage.setItem("counterpoint-demo-sales", JSON.stringify(sales));
  }, [mode, sales]);

  useEffect(() => {
    if (mode !== "demo") return;
    localStorage.setItem("counterpoint-demo-team", JSON.stringify(team));
  }, [mode, team]);

  useEffect(() => {
    if (mode !== "demo") return;
    localStorage.setItem(
      "counterpoint-demo-suppliers",
      JSON.stringify(suppliers),
    );
  }, [mode, suppliers]);

  useEffect(() => {
    if (mode !== "demo") return;
    localStorage.setItem(
      "counterpoint-demo-categories",
      JSON.stringify(inventoryCategories),
    );
  }, [mode, inventoryCategories]);

  useEffect(() => {
    if (mode !== "demo") return;
    localStorage.setItem(
      "counterpoint-demo-customers",
      JSON.stringify(customers),
    );
  }, [mode, customers]);

  useEffect(() => {
    if (mode !== "demo") return;
    localStorage.setItem(
      "counterpoint-demo-stock-movements",
      JSON.stringify(stockMovements),
    );
  }, [mode, stockMovements]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      localStorage.setItem(
        `counterpoint-held-orders-${user.id}`,
        JSON.stringify(heldOrdersByStore),
      );
    } catch (error) {
      console.error("Could not save held orders.", error);
    }
  }, [heldOrdersByStore, user?.id]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!showHeaderAccountMenu && !showNotificationCenter) return undefined;

    const dismissMenus = (event) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(".header-account"))
        setShowHeaderAccountMenu(false);
      if (!event.target.closest(".notification-center")) {
        setShowNotificationCenter(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setShowHeaderAccountMenu(false);
        setShowNotificationCenter(false);
      }
    };

    document.addEventListener("pointerdown", dismissMenus);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissMenus);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [showHeaderAccountMenu, showNotificationCenter]);

  useEffect(() => {
    if (mode !== "authenticated" || page !== "sales") {
      return undefined;
    }
    const search = transactionQuery.trim();
    let current = true;
    const timer = window.setTimeout(() => {
      listSales({
        page: salesPage,
        pageSize: 50,
        search,
        dateFrom: salesDateFrom,
        dateTo: salesDateTo,
      })
        .then(({ sales: results, total }) => {
          if (current) {
            setSales(results);
            setSalesTotalCount(total);
          }
        })
        .catch((error) => {
          if (current) setToast(error.message);
        });
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [mode, page, salesDateFrom, salesDateTo, salesPage, transactionQuery]);

  async function loadStoreWorkspace(activeUser, storeId) {
    localStorage.setItem("counterpoint-active-store", String(storeId));
    const [
      productData,
      saleData,
      userData,
      supplierData,
      categoryData,
      customerData,
      salesSummaryData,
    ] = await Promise.all([
      listProducts(),
      listSales({ page: 1, pageSize: 50 }),
      ["owner", "manager"].includes(activeUser.role)
        ? listTeamMembers()
        : Promise.resolve({ users: [] }),
      ["owner", "manager"].includes(activeUser.role)
        ? listSuppliers()
        : Promise.resolve({ suppliers: [] }),
      listCategories(),
      listCustomers(),
      getSalesSummary(localSalesSummaryRange()),
    ]);
    setProducts(productData.products.map(normalizeProduct));
    setSales(saleData.sales);
    setSalesTotalCount(saleData.total);
    setSalesPage(1);
    setSalesSummary(salesSummaryData);
    setTeam(userData.users);
    setActiveStoreId(String(storeId));
    setSuppliers(supplierData.suppliers);
    setInventoryCategories(categoryData.categories);
    setCustomers(customerData.customers);
    setStockMovements([]);
    setStockReport(null);
    setTransactionQuery("");
    setCart([]);
    setCashReceived("");
  }

  useEffect(() => {
    if (
      page !== "overview" ||
      !activeStoreId ||
      !["demo", "authenticated"].includes(mode)
    ) {
      return undefined;
    }
    let current = true;
    if (mode === "demo") {
      setDashboardInsights(buildDemoDashboardInsights(sales, dashboardCustomRange ? dashboardRangeKeys(dashboardCustomRange) : lastDayKeys(new Date(), 30)));
      return () => {
        current = false;
      };
    }

    const params = new URLSearchParams(localDashboardRange(dashboardCustomRange ? dashboardPeriod : 30, dashboardCustomRange));
    requestApi(`/dashboard/insights?${params}`)
      .then((insights) => {
        if (current) setDashboardInsights(insights);
      })
      .catch((error) => {
        if (current) setToast(error.message);
      });
    return () => {
      current = false;
    };
  }, [activeStoreId, mode, page, sales, dashboardPeriod, dashboardCustomRange]);

  async function loadWorkspace(activeUser) {
    if (activeUser.mustChangePassword) {
      setUser(activeUser);
      setMode("password-change-required");
      setAuthError("");
      return;
    }
    setHeldOrdersByStore(readHeldOrders(activeUser.id));
    const { stores: availableStores } = await listStores();
    if (availableStores.length === 0) {
      throw new Error(
        "No store is assigned to your account. Ask an owner or manager for access.",
      );
    }
    const savedStoreId = localStorage.getItem("counterpoint-active-store");
    const selectedStore =
      availableStores.find((store) => String(store.id) === savedStoreId) ??
      availableStores[0];
    setStores(availableStores);
    if (["owner", "manager"].includes(activeUser.role)) {
      const { stores: allStores } = await listStores({ includeInactive: true });
      setManagementStores(allStores);
    } else {
      setManagementStores([]);
    }
    await loadStoreWorkspace(activeUser, selectedStore.id);
    setUser(activeUser);
    setPage("overview");
    setCart([]);
    setMode("authenticated");
    setAuthError("");
  }

  async function switchStore(storeId) {
    if (!user) return false;
    if (String(storeId) === activeStoreId) return true;
    const previousStoreId = activeStoreId;
    try {
      await loadStoreWorkspace(user, storeId);
      setPage("overview");
      setToast(
        `Switched to ${stores.find((store) => String(store.id) === String(storeId))?.name ?? "store"}.`,
      );
      return true;
    } catch (error) {
      localStorage.setItem("counterpoint-active-store", previousStoreId);
      setActiveStoreId(previousStoreId);
      setToast(error.message);
      return false;
    }
  }

  useEffect(() => {
    if (mode !== "loading") return;
    getSession()
      .then(({ user: activeUser }) => loadWorkspace(activeUser))
      .catch((error) => {
        if (error.status === 401) {
          setMode("login");
          return;
        }
        setAuthError(error.message);
        setMode("auth-error");
      });
  }, [mode]);

  const isDemo = mode === "demo";
  const { inStock, lowStock, outOfStock } = getStockHealth(products);
  const stockStatusTotal = inStock.length + lowStock.length + outOfStock.length;
  const inStockStop = stockStatusTotal
    ? (inStock.length / stockStatusTotal) * 100
    : 0;
  const lowStockStop = stockStatusTotal
    ? ((inStock.length + lowStock.length) / stockStatusTotal) * 100
    : 0;
  const { count: cartCount, subtotalCents, totalCents, total } = summarizeCart(cart);
  const subtotal = subtotalCents / 100;
  const heldOrders = heldOrdersByStore[activeStoreId] ?? [];
  const cashReceivedCents = amountCents(cashReceived);
  const changeToReturn =
    cashReceivedCents === null
      ? 0
      : Math.max(0, cashReceivedCents - totalCents) / 100;
  const checkoutCustomer =
    customers.find(
      (customer) => String(customer.id) === String(selectedCustomerId),
    ) ?? null;
  const paymentIsValid =
    cashReceivedCents !== null && cashReceivedCents >= totalCents;
  const cartHasAvailableStock = cart.every(
    (item) =>
      (products.find((product) => product.id === item.id)?.stock ?? 0) >=
      item.quantity,
  );
  const canCompleteSale =
    cart.length > 0 &&
    paymentIsValid &&
    cartHasAvailableStock &&
    !saleBusy &&
    !quoteReview;
  const checkoutLocked = saleBusy;
  const demoTodaySales = isDemo
    ? sales.filter(
        (sale) =>
          new Date(sale.date).toDateString() === new Date().toDateString(),
      )
    : [];
  const todaySaleCount = isDemo
    ? demoTodaySales.length
    : (salesSummary?.todayCount ?? 0);
  const todayRevenue = isDemo
    ? demoTodaySales.reduce((sum, sale) => sum + sale.total, 0)
    : (salesSummary?.todayRevenue ?? 0);
  const allSalesCount = isDemo
    ? sales.length
    : (salesSummary?.totalCount ?? salesTotalCount);
  const dashboardTrend = fillSalesTrend(dashboardInsights.trend, dashboardCustomRange ? dashboardRangeKeys(dashboardCustomRange) : lastDayKeys(new Date(), 30));
  const dashboardKpiTrend = dashboardCustomRange ? dashboardTrend : dashboardTrend.slice(-dashboardPeriod);
  const dashboardRangeRevenue = dashboardKpiTrend.reduce((sum, day) => sum + day.revenue, 0);
  const dashboardRangeOrders = dashboardKpiTrend.reduce((sum, day) => sum + day.count, 0);
  const dashboardPaymentTotal = dashboardInsights.payments.reduce(
    (sum, payment) => sum + payment.revenue,
    0,
  );
  const expiryToday = new Date().toISOString().slice(0, 10);
  const expiryAlerts = findExpiringProducts(products, expiryToday);
  const expiryWatchProducts = expiryAlerts.slice(0, 5);
  const notificationItems = buildInventoryNotifications({
    lowStock,
    outOfStock,
    expiryAlerts,
    today: expiryToday,
  });
  const productSearchTerm = query.trim().toLowerCase();
  const availableCheckoutProducts = products.filter((product) => product.stock > 0);
  const filteredInventory = filterInventory(products, inventoryQuery, inventoryLowStockOnly);
  const filteredTransactions = isDemo
    ? filterDemoSales(sales, { query: transactionQuery, dateFrom: salesDateFrom, dateTo: salesDateTo })
    : sales;
  const demoSalesPage = isDemo ? paginate(filteredTransactions, salesPage) : null;
  const transactionTotal = isDemo ? demoSalesPage.total : salesTotalCount;
  const displayedTransactions = isDemo ? demoSalesPage.items : filteredTransactions;
  const transactionPages = isDemo ? demoSalesPage.pageCount : Math.max(1, Math.ceil(transactionTotal / 50));

  function addToCart(product) {
    if (saleBusy) return false;
    const inCart = cart.find((item) => item.id === product?.id)?.quantity ?? 0;
    if (!product || inCart >= product.stock) {
      setToast("You’ve reached the available stock for this item.");
      return false;
    }
    setCart((items) => addCartItem(items, product).cart);
    return true;
  }

  function addScannedProduct(code) {
    const normalizedCode = code.trim().toLocaleLowerCase();
    if (!normalizedCode) return;
    const product = products.find(
      (item) => item.sku.trim().toLocaleLowerCase() === normalizedCode,
    );
    if (!product) {
      setToast(`No product matches SKU “${code.trim()}”.`);
      return;
    }
    if (addToCart(product)) setQuery("");
  }

  function updateQuantity(productId, amount) {
    if (saleBusy) return;
    setCart((items) => changeCartQuantity(items, productId, amount, products));
  }

  function resetCurrentSale() {
    setCart([]);
    setSelectedCustomerId("");
    setCashReceived("");
    setQuoteReview(null);
    saleIdempotencyRef.current = null;
  }

  function snapshotCurrentOrder() {
    return {
      id: heldOrderId(),
      items: cart,
      customerId: selectedCustomerId,
      cashReceived,
      createdAt: currentTimestamp(),
    };
  }

  function holdOrder() {
    if (!cart.length) return;
    const order = snapshotCurrentOrder();
    setHeldOrdersByStore((items) => ({
      ...items,
      [activeStoreId]: [order, ...(items[activeStoreId] ?? [])],
    }));
    resetCurrentSale();
    setToast("Order held. Resume it when you’re ready.");
  }

  function resumeHeldOrder(orderId) {
    const heldOrder = heldOrders.find((order) => order.id === orderId);
    if (!heldOrder) return;
    const updatedHeldOrders = heldOrders.filter(
      (order) => order.id !== orderId,
    );
    if (cart.length) updatedHeldOrders.unshift(snapshotCurrentOrder());
    setHeldOrdersByStore((items) => ({
      ...items,
      [activeStoreId]: updatedHeldOrders,
    }));
    setCart(heldOrder.items);
    setSelectedCustomerId(heldOrder.customerId);
    setCashReceived(heldOrder.cashReceived ?? "");
    setToast("Held order resumed.");
  }

  function cancelHeldOrder(orderId) {
    setHeldOrdersByStore((items) => ({
      ...items,
      [activeStoreId]: (items[activeStoreId] ?? []).filter(
        (order) => order.id !== orderId,
      ),
    }));
    setToast("Held order cancelled.");
  }

  function cancelSale() {
    if (!cart.length || saleBusy) return;
    if (!window.confirm("Cancel this sale and clear the current order?"))
      return;
    resetCurrentSale();
    setToast("Sale cancelled.");
  }

  function applyQuoteForReview(quote) {
    const quotedProducts = quote.products.map(normalizeProduct);
    const quotedIds = new Set(quotedProducts.map((product) => product.id));
    const unavailableProductIds = new Set(
      quote.unavailableProductIds ??
        cart.filter((item) => !quotedIds.has(item.id)).map((item) => item.id),
    );
    const unavailableNames = cart
      .filter((item) => unavailableProductIds.has(item.id))
      .map((item) => item.name);
    const previousTotalCents = amountCents(total) ?? 0;
    const changed =
      previousTotalCents !== quote.totalCents ||
      !quote.available ||
      unavailableProductIds.size > 0 ||
      cart.some((item) => {
        const current = quote.items.find(
          (quotedItem) => quotedItem.productId === item.id,
        );
        return (
          !current ||
          saleUnitPriceCents(item, item.quantity) !== current.unitPriceCents
        );
      });
    setProducts((items) =>
      items
        .filter((item) => !unavailableProductIds.has(item.id))
        .map(
          (item) =>
            quotedProducts.find((quoted) => quoted.id === item.id) ?? item,
        ),
    );
    if (!changed) {
      setQuoteReview(null);
      return false;
    }
    setCart((items) =>
      items
        .map((item) => {
          const current = quotedProducts.find(
            (quoted) => quoted.id === item.id,
          );
          return current ? { ...current, quantity: item.quantity } : item;
        })
        .filter((item) => !unavailableProductIds.has(item.id)),
    );
    setCashReceived("");
    setQuoteReview({
      previousTotalCents,
      nextTotalCents: quote.totalCents,
      available: quote.available,
      unavailableNames,
    });
    saleIdempotencyRef.current = null;
    return true;
  }

  async function refreshSalesSummary() {
    if (isDemo) return;
    try {
      setSalesSummary(await getSalesSummary(localSalesSummaryRange()));
    } catch (error) {
      setToast(
        `Sale completed, but dashboard totals could not refresh: ${error.message}`,
      );
    }
  }

  async function completeSale() {
    if (saleSubmissionLock.current || !canCompleteSale) return;
    saleSubmissionLock.current = true;
    setSaleBusy(true);
    let sale;
    const selectedCustomer = checkoutCustomer;
    try {
      const salePayload = isDemo
        ? null
        : {
            items: cart.map(({ id, quantity }) => ({
              productId: id,
              quantity,
            })),
            method: "Cash",
            cashReceivedCents,
            customerId: selectedCustomer?.id ?? null,
            expectedTotalCents: totalCents,
          };
      let retryingIdempotentSale = false;
      if (salePayload) {
        const fingerprint = JSON.stringify(salePayload);
        retryingIdempotentSale =
          saleIdempotencyRef.current?.fingerprint === fingerprint;
        if (!retryingIdempotentSale) {
          saleIdempotencyRef.current = {
            fingerprint,
            key: globalThis.crypto.randomUUID(),
          };
        }
      }
      if (!isDemo && !retryingIdempotentSale) {
        const { quote } = await quoteSale(
          cart.map(({ id, quantity }) => ({ productId: id, quantity })),
        );
        if (applyQuoteForReview(quote)) {
          setToast(
            quote.available
              ? "Prices changed. Review the updated total and payment before completing the sale."
              : "Stock changed. Review the updated order and quantities before completing the sale.",
          );
          return;
        }
      }
      if (isDemo) {
        sale = {
          id: `GG-${2003 + sales.length - initialSales.length}`,
          items: cartCount,
          total,
          date: currentTimestamp(),
          method: "Cash",
          cashReceived: cashReceivedCents / 100,
          change: changeToReturn,
          cashierId: user.id,
          cashierName: user.name,
          customerId: selectedCustomer?.id ?? null,
          customerName: selectedCustomer?.name ?? "Walk-in customer",
          subtotal,
          itemsDetail: cart.map((item) => {
            const unitPriceCents = saleUnitPriceCents(item, item.quantity);
            return {
              productName: item.name,
              quantity: item.quantity,
              unitPrice: unitPriceCents / 100,
              lineTotal: (unitPriceCents * item.quantity) / 100,
            };
          }),
        };
      } else {
        const result = await submitCashSale(
          salePayload,
          saleIdempotencyRef.current.key,
        );
        sale = result.sale;
        sale.itemsDetail = result.sale.receiptItems;
        setProducts((items) =>
          items.map(
            (product) =>
              sale.products.find((updated) => updated.id === product.id) ??
              product,
          ),
        );
      }
    } catch (error) {
      if (error.quote) {
        applyQuoteForReview(error.quote);
        setToast(error.message);
        return;
      }
      setToast(error.message);
      return;
    } finally {
      saleSubmissionLock.current = false;
      setSaleBusy(false);
    }
    saleIdempotencyRef.current = null;
    setSales((items) =>
      salesPage === 1 && !isDemo
        ? [sale, ...items.filter((item) => item.id !== sale.id)].slice(0, 50)
        : [sale, ...items],
    );
    if (!isDemo) void refreshSalesSummary();
    setReceipt(sale);
    if (isDemo) {
      setProducts((items) =>
        items.map((product) => {
          const sold = cart.find((item) => item.id === product.id);
          return sold
            ? { ...product, stock: product.stock - sold.quantity }
            : product;
        }),
      );
    }
    resetCurrentSale();
    setToast(`Sale ${sale.id} completed successfully.`);
  }

  async function openTransactionReceipt(transaction, printAfterOpen = false) {
    setReceiptBusyId(transaction.id);
    try {
      let detail = transaction;
      if (!isDemo) {
        const saleId = Number(String(transaction.id).replace(/^CP-/, ""));
        const result = await getSale(saleId);
        detail = result.sale;
      }
      setReceipt(detail);
      if (printAfterOpen) window.setTimeout(() => window.print(), 150);
    } catch (error) {
      setToast(error.message);
    } finally {
      setReceiptBusyId("");
    }
  }

  function readProductForm(formData, includeStock) {
    const productData = {
      name: String(formData.get("name") ?? "").trim(),
      ...(editingProduct
        ? {
            sku: String(formData.get("sku") ?? "")
              .trim()
              .toUpperCase(),
          }
        : {}),
      category: String(formData.get("category") ?? "").trim(),
      costPrice: Number(formData.get("costPrice")),
      price: Number(formData.get("price")),
      wholesalePrice: Number(formData.get("wholesalePrice")),
      wholesaleQuantity: Number(formData.get("wholesaleQuantity") || 0),
      reorderLevel: Number(formData.get("reorderLevel")),
      supplierId: formData.get("supplierId")
        ? Number(formData.get("supplierId"))
        : null,
      expiryDate: String(formData.get("expiryDate") ?? ""),
      productionDescription: String(
        formData.get("productionDescription") ?? "",
      ).trim(),
      mftDate: String(formData.get("mftDate") ?? "") || null,
    };
    if (!editingProduct) {
      productData.storeId = Number(formData.get("storeId"));
    }
    productData.supplier =
      suppliers.find((supplier) => supplier.id === productData.supplierId)
        ?.name ?? "";
    if (includeStock) productData.stock = Number(formData.get("stock"));
    return productData;
  }

  async function createCategory(event) {
    event.preventDefault();
    const name = String(
      new FormData(event.currentTarget).get("name") ?? "",
    ).trim();
    if (
      !name ||
      name.length > 60 ||
      inventoryCategories.some(
        (item) =>
          item.name.toLowerCase() === name.toLowerCase() &&
          item.id !== editingCategory?.id,
      )
    ) {
      setToast(
        name
          ? "A category with that name already exists."
          : "Enter a category name.",
      );
      return;
    }
    try {
      const savedCategory = editingCategory
        ? isDemo
          ? { ...editingCategory, name }
          : (
              await updateCategory(editingCategory.id, name)
            ).category
        : isDemo
          ? { id: Date.now(), name }
          : (
              await createCategoryRequest(name)
            ).category;
      if (editingCategory) {
        setInventoryCategories((items) =>
          items
            .map((item) =>
              item.id === editingCategory.id ? savedCategory : item,
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        setProducts((items) =>
          items.map((product) =>
            product.category === editingCategory.name
              ? { ...product, category: savedCategory.name }
              : product,
          ),
        );
      } else {
        setInventoryCategories((items) =>
          [...items, savedCategory].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      }
      setShowCategoryForm(false);
      setToast(
        editingCategory
          ? `${savedCategory.name} updated.`
          : `${savedCategory.name} added to categories.`,
      );
      setEditingCategory(null);
    } catch (error) {
      setToast(error.message);
    }
  }

  async function createProduct(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const productData = readProductForm(formData, !editingProduct);
    const apiProductData = { ...productData, sellingPrice: productData.price };
    if (
      !productData.name ||
      (editingProduct && !productData.sku) ||
      !productData.category ||
      !inventoryCategories.some((item) => item.name === productData.category) ||
      !Number.isFinite(productData.price) ||
      productData.price <= 0 ||
      !Number.isFinite(productData.costPrice) ||
      productData.costPrice < 0 ||
      !Number.isFinite(productData.wholesalePrice) ||
      productData.wholesalePrice < 0 ||
      !Number.isInteger(productData.wholesaleQuantity) ||
      productData.wholesaleQuantity < 0 ||
      productData.wholesaleQuantity > 1_000_000 ||
      (productData.wholesaleQuantity > 0 && productData.wholesalePrice <= 0) ||
      productData.productionDescription.length > 2000 ||
      (!editingProduct &&
        !stores.some((store) => Number(store.id) === productData.storeId)) ||
      !Number.isInteger(productData.reorderLevel) ||
      productData.reorderLevel < 0 ||
      (!editingProduct &&
        (!Number.isInteger(productData.stock) || productData.stock < 0))
    ) {
      setToast(
        "Review the product details. Prices must be valid, and stock/reorder values must be whole numbers.",
      );
      return;
    }
    if (
      isDemo &&
      editingProduct &&
      products.some(
        (product) =>
          product.sku === productData.sku && product.id !== editingProduct.id,
      )
    ) {
      setToast("That SKU is already assigned to another product.");
      return;
    }
    try {
      if (editingProduct) {
        const updatedProduct = isDemo
          ? normalizeProduct({ ...editingProduct, ...productData })
          : (
              await updateProduct(editingProduct.id, apiProductData)
            ).product;
        setProducts((items) =>
          items.map((item) =>
            item.id === editingProduct.id ? updatedProduct : item,
          ),
        );
        setToast(`${updatedProduct.name} updated.`);
        setEditingProduct(null);
      } else {
        const demoId = Date.now();
        const createdProduct = isDemo
          ? normalizeProduct({
              id: demoId,
              sku: `CP-${String(demoId).padStart(6, "0")}`,
              ...productData,
              color: "#e8e8ef",
              initials: productData.name
                .split(/\s+/)
                .slice(0, 2)
                .map((word) => word[0])
                .join("")
                .toUpperCase(),
            })
          : (
              await createProduct(apiProductData)
            ).product;
        const currentStoreProduct =
          String(productData.storeId) === activeStoreId
            ? createdProduct
            : { ...createdProduct, stock: 0 };
        setProducts((items) => [...items, currentStoreProduct]);
        if (isDemo && createdProduct.stock > 0) {
          setStockMovements((items) => [
            {
              id: Date.now(),
              productId: createdProduct.id,
              productName: createdProduct.name,
              sku: createdProduct.sku,
              userName: user.name,
              quantity: createdProduct.stock,
              reason: "Opening stock",
              date: Date.now(),
            },
            ...items,
          ]);
        }
        setToast(`${createdProduct.name} added to inventory.`);
      }
      setShowProductForm(false);
    } catch (error) {
      setToast(error.message);
    }
  }

  async function manageStock(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const quantity = Number(formData.get("quantity"));
    const direction = formData.get("direction") === "remove" ? -1 : 1;
    const adjustment = direction * quantity;
    const reason = String(formData.get("reason") ?? "").trim();
    const validationMessage = validateStockAdjustment({
      stock: stockProduct.stock,
      quantity,
      direction: direction < 0 ? "remove" : "add",
      reason,
    });
    if (validationMessage) {
      setToast(validationMessage);
      return;
    }
    try {
      let updatedProduct;
      if (isDemo) {
        updatedProduct = {
          ...stockProduct,
          stock: stockProduct.stock + adjustment,
        };
        setStockMovements((items) => [
          {
            id: Date.now(),
            productId: stockProduct.id,
            productName: stockProduct.name,
            sku: stockProduct.sku,
            userName: user.name,
            quantity: adjustment,
            reason,
            date: Date.now(),
          },
          ...items,
        ]);
      } else {
        ({ product: updatedProduct } = await adjustProductStock(
          stockProduct.id,
          adjustment,
          reason,
        ));
      }
      setProducts((items) =>
        items.map((product) =>
          product.id === updatedProduct.id ? updatedProduct : product,
        ),
      );
      setStockProduct(null);
      setToast(`Stock updated for ${updatedProduct.name}.`);
      if (page === "stock-report") void loadStockReport();
    } catch (error) {
      setToast(error.message);
    }
  }

  async function createStore(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const storeDetails = {
      name,
      branch: String(formData.get("branch") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
    };
    const storeId = editingStore?.id;
    const duplicateStore = managementStores.some(
      (store) =>
        store.id !== storeId &&
        store.name.trim().toLowerCase() === name.toLowerCase() &&
        (store.branch ?? "").trim().toLowerCase() ===
          storeDetails.branch.toLowerCase(),
    );
    if (!name || name.length > 120 || duplicateStore) {
      setToast(
        !name
          ? "Enter a store name."
          : duplicateStore
            ? "A branch with that name already exists for this store."
            : "Enter a valid store name.",
      );
      return;
    }
    try {
      if (isDemo)
        throw new Error(
          "Manage stores from a connected account; demo data is browser-local.",
        );
      const { store } = await saveStore(storeId, {
        ...storeDetails,
        ...(storeId ? { active: editingStore.active } : {}),
      });
      setManagementStores((items) =>
        (storeId
          ? items.map((item) => (item.id === store.id ? store : item))
          : [...items, store]
        ).sort((a, b) => a.name.localeCompare(b.name)),
      );
      if (store.active) {
        setStores((items) =>
          (storeId
            ? items.map((item) => (item.id === store.id ? store : item))
            : [...items, store]
          ).sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      setShowStoreForm(false);
      setEditingStore(null);
      if (storeId) {
        setToast(`${storeLabel(store)} updated.`);
        return;
      }
      const switched = await switchStore(store.id);
      if (switched) setToast(`${storeLabel(store)} added.`);
      else
        setToast(
          `${storeLabel(store)} was added, but its data could not be loaded.`,
        );
    } catch (error) {
      setToast(error.message);
    }
  }

  async function toggleStoreStatus(store) {
    try {
      if (isDemo) {
        throw new Error(
          "Manage stores from a connected account; demo data is browser-local.",
        );
      }
      const updated = { ...store, active: !store.active };
      const { store: savedStore } = await saveStore(store.id, updated);
      setManagementStores((items) =>
        items.map((item) => (item.id === savedStore.id ? savedStore : item)),
      );
      setStores((items) =>
        (savedStore.active
          ? [...items.filter((item) => item.id !== savedStore.id), savedStore]
          : items.filter((item) => item.id !== savedStore.id)
        ).sort((a, b) => a.name.localeCompare(b.name)),
      );
      let switchedAway = true;
      if (!savedStore.active && String(store.id) === activeStoreId) {
        const replacement = stores.find(
          (item) => item.id !== store.id && item.active !== false,
        );
        if (replacement) {
          switchedAway = await switchStore(replacement.id);
        }
      }
      setToast(
        `${savedStore.name} ${savedStore.active ? "activated" : "deactivated"}${switchedAway ? "." : ". Select another active store to continue."}`,
      );
    } catch (error) {
      setToast(error.message);
    }
  }

  function openTeamForm(member = null) {
    setEditingTeamMember(member);
    setCreatedCredential(null);
    setTemporaryPassword(member ? "" : generateTemporaryPassword());
    setShowTemporaryPassword(false);
    setShowTeamForm(true);
  }

  async function copyTemporaryPassword(password) {
    try {
      await navigator.clipboard.writeText(password);
      setToast("Temporary password copied.");
    } catch (error) {
      setToast(`Could not copy the password: ${error.message}`);
    }
  }

  async function resetTeamMemberPassword(member) {
    setTeamActionBusyId(String(member.id));
    try {
      const password = isDemo
        ? generateTemporaryPassword()
        : (
            await resetTeamMemberPasswordRequest(member.id)
          ).temporaryPassword;
      setCreatedCredential({
        name: member.name,
        password,
        action: "reset",
      });
    } catch (error) {
      setToast(error.message);
    } finally {
      setTeamActionBusyId("");
    }
  }

  async function changeOwnPassword(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    if (newPassword.length < 8 || newPassword.length > 72) {
      const message = "Your new password must be between 8 and 72 characters.";
      if (mode === "password-change-required") setAuthError(message);
      else setToast(message);
      return;
    }
    if (newPassword !== confirmPassword) {
      const message = "The new passwords do not match.";
      if (mode === "password-change-required") setAuthError(message);
      else setToast(message);
      return;
    }

    setPasswordChangeBusy(true);
    try {
      await changePassword({ currentPassword, newPassword });
      if (mode === "password-change-required") {
        const { user: activeUser } = await getSession();
        await loadWorkspace(activeUser);
        setToast("Password changed. You can now use your account.");
        return;
      }
      setShowPasswordChange(false);
      setShowPasswordChangeFields(false);
      setToast("Your password was changed successfully.");
    } catch (error) {
      if (mode === "password-change-required") setAuthError(error.message);
      else setToast(error.message);
    } finally {
      setPasswordChangeBusy(false);
    }
  }

  async function createTeamMember(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const member = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      storeIds: formData.getAll("storeIds").map(Number),
    };
    try {
      if (editingTeamMember) {
        const updated = isDemo
          ? {
              ...editingTeamMember,
              ...member,
              stores: stores.filter((store) =>
                member.storeIds.includes(Number(store.id)),
              ),
            }
          : (
              await updateTeamMemberRequest(editingTeamMember.id, {
                ...member,
                active: editingTeamMember.active,
              })
            ).user;
        setTeam((items) =>
          items.flatMap((item) => {
            if (item.id !== editingTeamMember.id) return [item];
            return (updated.stores ?? []).some(
              (store) => String(store.id) === activeStoreId,
            )
              ? [updated]
              : [];
          }),
        );
        setToast(`${updated.name} updated.`);
      } else {
        const newMember = {
          ...member,
          password: temporaryPassword,
          role: String(formData.get("role") ?? ""),
        };
        if (isDemo) {
          setTeam((items) => [
            ...items,
            {
              ...member,
              role: newMember.role,
              stores: stores.filter((store) =>
                newMember.storeIds.includes(Number(store.id)),
              ),
              id: Date.now(),
              active: true,
              createdAt: Date.now(),
            },
          ]);
        } else {
          const result = await createTeamMemberRequest(newMember);
          setTeam((items) => [...items, result.user]);
        }
        setCreatedCredential({
          name: newMember.name,
          password: newMember.password,
          action: "created",
        });
        setTemporaryPassword("");
      }
      setShowTeamForm(false);
      setEditingTeamMember(null);
    } catch (error) {
      setToast(error.message);
    }
  }

  async function toggleCashierStatus(member) {
    setTeamActionBusyId(String(member.id));
    try {
      const updated = isDemo
        ? { ...member, active: !member.active }
        : (
            await updateTeamMemberRequest(member.id, {
              name: member.name,
              email: member.email,
              storeIds: (member.stores ?? []).map((store) => Number(store.id)),
              active: !member.active,
            })
          ).user;
      setTeam((items) =>
        items.map((item) => (item.id === member.id ? updated : item)),
      );
      setToast(
        `${member.name} ${updated.active ? "activated" : "deactivated"}.`,
      );
    } catch (error) {
      setToast(error.message);
    } finally {
      setTeamActionBusyId("");
    }
  }

  async function createSupplier(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const supplier = {
      name: String(formData.get("name") ?? "").trim(),
      contactName: String(formData.get("contactName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
    };
    if (
      !supplier.name ||
      suppliers.some(
        (item) =>
          item.name.toLowerCase() === supplier.name.toLowerCase() &&
          item.id !== editingSupplier?.id,
      )
    ) {
      setToast(
        supplier.name
          ? "A supplier with that name already exists."
          : "Enter a supplier name.",
      );
      return;
    }
    try {
      const savedSupplier = editingSupplier
        ? isDemo
          ? { ...editingSupplier, ...supplier }
          : (
              await updateSupplier(editingSupplier.id, supplier)
            ).supplier
        : isDemo
          ? { ...supplier, id: Date.now(), createdAt: Date.now() }
          : (
              await createSupplierRequest(supplier)
            ).supplier;
      if (editingSupplier) {
        setSuppliers((items) =>
          items
            .map((item) =>
              item.id === editingSupplier.id ? savedSupplier : item,
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        setProducts((items) =>
          items.map((product) =>
            product.supplierId === editingSupplier.id
              ? { ...product, supplier: savedSupplier.name }
              : product,
          ),
        );
      } else {
        setSuppliers((items) =>
          [...items, savedSupplier].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      }
      setShowSupplierForm(false);
      setToast(
        editingSupplier
          ? `${savedSupplier.name} updated.`
          : `${savedSupplier.name} added to suppliers.`,
      );
      setEditingSupplier(null);
    } catch (error) {
      setToast(error.message);
    }
  }

  async function saveCustomer(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const customer = {
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
    };
    if (
      !customer.name ||
      customer.name.length > 120 ||
      customer.phone.length > 40 ||
      customer.email.length > 254 ||
      customer.notes.length > 500
    ) {
      setToast("Review the customer details and try again.");
      return;
    }
    try {
      const savedCustomer = editingCustomer
        ? isDemo
          ? { ...editingCustomer, ...customer }
          : (
              await updateCustomer(editingCustomer.id, customer)
            ).customer
        : isDemo
          ? { ...customer, id: Date.now(), createdAt: Date.now() }
          : (
              await createCustomer(customer)
            ).customer;
      if (editingCustomer) {
        setCustomers((items) =>
          items
            .map((item) =>
              item.id === editingCustomer.id ? savedCustomer : item,
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        if (viewingCustomerHistory?.id === savedCustomer.id)
          setViewingCustomerHistory(savedCustomer);
      } else {
        setCustomers((items) =>
          [...items, savedCustomer].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
        if (page === "checkout")
          setSelectedCustomerId(String(savedCustomer.id));
      }
      setShowCustomerForm(false);
      setToast(
        editingCustomer
          ? `${savedCustomer.name} updated.`
          : `${savedCustomer.name} added.`,
      );
      setEditingCustomer(null);
    } catch (error) {
      setToast(error.message);
    }
  }

  async function viewCustomerHistory(customer) {
    setCustomerHistoryBusy(true);
    setViewingCustomerHistory(customer);
    setCustomerHistory([]);
    setCustomerHistoryPage(1);
    setPage("customer-history");
    try {
      if (isDemo) {
        const customerSales = sales
          .filter((sale) => sale.customerId === customer.id)
          .map((sale) => ({
            ...sale,
            itemCount: sale.items,
            items: sale.itemsDetail ?? [],
          }));
        setCustomerHistory(customerSales.slice(0, 50));
        setCustomerHistoryTotal(customerSales.length);
      } else {
        const result = await getCustomerHistory(customer.id);
        setViewingCustomerHistory(result.customer);
        setCustomerHistory(result.sales);
        setCustomerHistoryTotal(result.total);
      }
    } catch (error) {
      setToast(error.message);
    } finally {
      setCustomerHistoryBusy(false);
    }
  }

  async function loadCustomerHistoryPage(pageNumber) {
    if (!viewingCustomerHistory || customerHistoryBusy) return;
    setCustomerHistoryBusy(true);
    setCustomerHistoryPage(pageNumber);
    try {
      if (isDemo) {
        const customerSales = sales
          .filter((sale) => sale.customerId === viewingCustomerHistory.id)
          .map((sale) => ({
            ...sale,
            itemCount: sale.items,
            items: sale.itemsDetail ?? [],
          }));
        setCustomerHistory(
          customerSales.slice((pageNumber - 1) * 50, pageNumber * 50),
        );
      } else {
        const result = await getCustomerHistory(viewingCustomerHistory.id, pageNumber);
        setCustomerHistory(result.sales);
        setCustomerHistoryTotal(result.total);
      }
    } catch (error) {
      setToast(error.message);
    } finally {
      setCustomerHistoryBusy(false);
    }
  }

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
        ? "Good afternoon"
        : "Good evening";
  const pageTitle = {
    overview: `${greeting}, ${user?.name?.split(/\s+/)[0] ?? "there"}`,
    checkout: "Point of Sale",
    inventory: "Inventory",
    "stock-report": "Stock Report",
    suppliers: "Suppliers",
    categories: "Categories",
    customers: "Customers",
    "customer-history": `${viewingCustomerHistory?.name ?? "Customer"} history`,
    sales: "Sales",
    settings: "Settings",
  }[page];

  const canManageInventory =
    isDemo || user?.role === "owner" || user?.role === "manager";
  const canManageCatalog =
    isDemo || user?.role === "owner" || user?.role === "manager";
  const activeStoreName = storeLabel(
    stores.find((store) => String(store.id) === activeStoreId) ?? {
      name: "Store",
    },
  );
  const reportGeneratedAt = new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
  const visibleNavItems = getVisiblePages(user?.role, navigationItems, isDemo);
  const goToPage = (nextPage) => {
    setMobileNavOpen(false);
    if (nextPage === "settings" && !["owner", "manager"].includes(user?.role)) {
      setToast("Only an owner or manager can manage store access.");
      return;
    }
    if (
      nextPage === "stock-report" &&
      !["owner", "manager"].includes(user?.role)
    ) {
      setToast("Only an owner or manager can view the stock report.");
      return;
    }
    if (
      nextPage === "suppliers" &&
      !["owner", "manager"].includes(user?.role) &&
      !isDemo
    ) {
      setToast("Only an owner or manager can manage suppliers.");
      return;
    }
    if (
      nextPage === "categories" &&
      !["owner", "manager"].includes(user?.role) &&
      !isDemo
    ) {
      setToast("Only an owner or manager can manage categories.");
      return;
    }
    if (
      ![
        "overview",
        "checkout",
        "inventory",
        "stock-report",
        "suppliers",
        "categories",
        "customers",
        "customer-history",
        "sales",
        "settings",
      ].includes(nextPage)
    ) {
      setToast("That page is not available.");
      return;
    }
    setPage(nextPage);
    if (nextPage === "stock-report") void loadStockReport();
  };

  async function loadStockReport() {
    setReportBusy(true);
    try {
      if (isDemo) {
        setStockReport(makeDemoReport(products, stockMovements));
      } else {
        const { report } = await getInventoryReport();
        setStockReport(report);
      }
    } catch (error) {
      setToast(error.message);
    } finally {
      setReportBusy(false);
    }
  }

  function printReport() {
    const removePrintMode = () =>
      document.body.classList.remove("report-print-mode");
    document.body.classList.add("report-print-mode");
    window.addEventListener("afterprint", removePrintMode, { once: true });
    window.print();
  }

  async function submitLogin(event) {
    event.preventDefault();
    setLoginBusy(true);
    setAuthError("");
    const formData = new FormData(event.currentTarget);
    try {
      const { user: activeUser } = await signIn(
        formData.get("email"),
        formData.get("password"),
      );
      localStorage.removeItem("counterpoint-demo-mode");
      await loadWorkspace(activeUser);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setLoginBusy(false);
    }
  }

  async function restoreSession() {
    setMode("loading");
    setAuthError("");
    try {
      const { user: activeUser } = await getSession();
      await loadWorkspace(activeUser);
    } catch (error) {
      if (error.status === 401) {
        setMode("login");
        return;
      }
      setAuthError(error.message);
      setMode("auth-error");
    }
  }

  async function signOut() {
    if (isDemo) {
      localStorage.removeItem("counterpoint-demo-mode");
    } else {
      try {
        await signOutSession();
      } catch (error) {
        setToast(error.message);
        return;
      }
    }
    setUser(null);
    setProducts([]);
    setSales([]);
    setTeam([]);
    setCart([]);
    localStorage.removeItem("counterpoint-active-store");
    setActiveStoreId("");
    setStores([]);
    setMode("login");
  }

  function enterDemo() {
    localStorage.setItem("counterpoint-demo-mode", "true");
    setHeldOrdersByStore(readHeldOrders("demo-owner"));
    setProducts(
      readDemoSaved("products", initialProducts).map(normalizeProduct),
    );
    setSales(readDemoSaved("sales", initialSales));
    setUser({
      id: "demo-owner",
      name: "Demo Owner",
      email: "demo@counterpoint.local",
      role: "owner",
    });
    setStores([initialDemoStore]);
    setActiveStoreId("1");
    setTeam(readDemoSaved("team", []));
    setSuppliers(readDemoSaved("suppliers", initialSuppliers));
    setCustomers(readDemoSaved("customers", initialCustomers));
    const demoProducts = readDemoSaved("products", initialProducts).map(
      normalizeProduct,
    );
    const savedCategories = readDemoSaved("categories", initialCategories);
    const categoryNames = new Set(
      savedCategories.map((item) => item.name.toLowerCase()),
    );
    setInventoryCategories(
      [
        ...savedCategories,
        ...[...new Set(demoProducts.map((product) => product.category))]
          .filter((name) => !categoryNames.has(name.toLowerCase()))
          .map((name, index) => ({ id: `legacy-${index}`, name })),
      ].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setStockMovements(readDemoSaved("stock-movements", []));
    setPage("overview");
    setMode("demo");
  }

  if (["loading", "password-change-required", "auth-error", "login"].includes(mode)) {
    return (
      <AuthGate
        mode={mode}
        error={authError}
        loginBusy={loginBusy}
        passwordChangeBusy={passwordChangeBusy}
        showLoginPassword={showLoginPassword}
        showPasswordChangeFields={showPasswordChangeFields}
        onLogin={submitLogin}
        onPasswordChange={changeOwnPassword}
        onToggleLoginPassword={() => setShowLoginPassword((visible) => !visible)}
        onTogglePasswordVisibility={() => setShowPasswordChangeFields((visible) => !visible)}
        onRetry={restoreSession}
        onEnterDemo={enterDemo}
      />
    );
  }
  return (
    <div
      className={`app-shell${page === "checkout" ? " app-shell--checkout" : ""}`}
      onWheelCapture={(event) => {
        if (
          event.target instanceof HTMLInputElement &&
          event.target.type === "number"
        ) {
          event.target.blur();
        }
      }}
    >
      {isDemo && (
        <div className="demo-banner">
          <Sparkles size={14} /> DEMO MODE — changes are saved only in this
          browser <button onClick={signOut}>Exit demo</button>
        </div>
      )}
      {mobileNavOpen && (
        <button
          className="mobile-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside
        id="workspace-sidebar"
        className={`sidebar${mobileNavOpen ? " sidebar-open" : ""}`}
      >
        <div className="sidebar-brand">
          <a
            className="brand"
            href="#overview"
            onClick={() => goToPage("overview")}
          >
            <div className="brand-mark">
              <Command size={20} strokeWidth={2.2} />
            </div>
            <span>
              counterpoint<span className="brand-period">.</span>
            </span>
          </a>
        </div>

        <div className="sidebar-navigation">
          <nav className="main-nav" aria-label="Main navigation">
            {visibleNavItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`nav-link${page === id ? " is-active" : ""}`}
                title={label}
                aria-label={label}
                onClick={() => goToPage(id)}
                aria-current={page === id ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
                {id === "inventory" && lowStock.length > 0 && (
                  <span className="nav-badge">{lowStock.length}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="icon-button mobile-menu-toggle"
            aria-label={
              mobileNavOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={mobileNavOpen}
            aria-controls="workspace-sidebar"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <button
            type="button"
            className="global-search"
            aria-label="Search products and open checkout"
            onClick={() => {
              goToPage("checkout");
              window.requestAnimationFrame(() =>
                window.requestAnimationFrame(() => productSearchRef.current?.focus()),
              );
            }}
          >
            <Search size={15} aria-hidden="true" />
            <span>Search products</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="header-store-picker">
            <span className="header-store-avatar" aria-hidden="true">
              {stores.find((store) => String(store.id) === activeStoreId)?.name
                ?.split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase() || "ST"}
            </span>
            <select
              aria-label="Switch store"
              value={activeStoreId}
              onChange={(event) => {
                void switchStore(event.target.value);
                setMobileNavOpen(false);
              }}
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {storeLabel(store)}
                </option>
              ))}
            </select>
            <ChevronDown size={13} aria-hidden="true" />
          </div>
          <div className="topbar-actions">
            <span className="today-label">
              <Clock3 size={14} />{" "}
              {new Intl.DateTimeFormat("en-GH", {
                weekday: "short",
                month: "short",
                day: "numeric",
              }).format(new Date())}
            </span>
            <NotificationCenter
              items={notificationItems}
              open={showNotificationCenter}
              onToggle={() => {
                setShowHeaderAccountMenu(false);
                setShowNotificationCenter((visible) => !visible);
              }}
              onViewInventory={() => {
                setShowNotificationCenter(false);
                setInventoryQuery("");
                setInventoryLowStockOnly(false);
                goToPage("inventory");
              }}
              onSelectAlert={(item) => {
                setShowNotificationCenter(false);
                setInventoryQuery(item.product.name);
                setInventoryLowStockOnly(item.type === "stock");
                goToPage("inventory");
                window.requestAnimationFrame(() =>
                  window.requestAnimationFrame(() => {
                    inventoryProductsRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                    inventoryProductsRef.current?.focus({
                      preventScroll: true,
                    });
                  }),
                );
              }}
            />
            <div className="header-account">
              {showHeaderAccountMenu && (
                <div
                  className="profile-menu header-account-menu"
                  role="menu"
                  aria-label="Account menu"
                >
                  <div className="profile-menu-identity">
                    <strong>{user?.name}</strong>
                    <span>{user?.email}</span>
                    <span>
                      {isDemo
                        ? "Demo account"
                        : user?.role === "owner"
                          ? "Administrator"
                          : user?.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isDemo}
                    onClick={() => {
                      setShowHeaderAccountMenu(false);
                      setShowPasswordChangeFields(false);
                      setShowPasswordChange(true);
                    }}
                  >
                    <KeyRound size={15} /> Change password
                  </button>
                  <button type="button" role="menuitem" onClick={signOut}>
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
              <button
                type="button"
                className="header-account-trigger"
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={showHeaderAccountMenu}
                onClick={() => {
                  setShowHeaderAccountMenu((visible) => !visible);
                }}
              >
                <span className="avatar-small" aria-hidden="true">
                  {user?.name
                    ?.split(/\s+/)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <span className="header-account-name">{user?.name}</span>
                <ChevronDown size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <div className={`content${page === "overview" ? " dashboard-page" : ""}`}>
          {page === "overview" && (
            <>
              <section className="welcome-row">
                <div>
                  <h1>{pageTitle}</h1>
                  <p className="page-subtitle">
                    {new Intl.DateTimeFormat("en-GH", { dateStyle: "full" }).format(new Date())}
                   
                  </p>
                </div>
                <div className="dashboard-toolbar">
                  <div className="dashboard-period" aria-label="Dashboard date range">
                    {[1, 7, 30].map((days) => <button type="button" key={days} className={!dashboardCustomRange && dashboardPeriod === days ? "is-active" : ""} onClick={() => { setDashboardCustomRange(null); setDashboardPeriod(days); setDashboardCustomOpen(false); }}>{days === 1 ? "Today" : `${days} days`}</button>)}
                    <button type="button" className={dashboardCustomRange ? "is-active" : ""} onClick={() => setDashboardCustomOpen((open) => !open)}>Custom</button>
                  </div>
                  {canManageCatalog ? <button className="primary-button" onClick={() => { setEditingProduct(null); setShowProductForm(true); }}><Plus size={17} /> Add product</button> : <button className="primary-button" onClick={() => goToPage("checkout")}><Plus size={17} /> New Sale</button>}
                </div>
              </section>
              <div className="dashboard-overview-caption">
                <strong>Business overview</strong>
                <span>·</span>
                <span>{dashboardCustomRange ? `${dashboardCustomRange.start} to ${dashboardCustomRange.end}` : dashboardPeriod === 1 ? "today vs yesterday" : `last ${dashboardPeriod} days vs previous ${dashboardPeriod} days`}</span>
                <span className="dashboard-updated"><RefreshCw size={13} /> Updated just now</span>
              </div>
              {dashboardCustomOpen && <div className="dashboard-custom-range"><label>From<input type="date" value={dashboardCustomDraft.start} onChange={(event) => setDashboardCustomDraft((draft) => ({ ...draft, start: event.target.value }))} /></label><span>to</span><label>To<input type="date" value={dashboardCustomDraft.end} onChange={(event) => setDashboardCustomDraft((draft) => ({ ...draft, end: event.target.value }))} /></label><button type="button" className="primary-button" disabled={!dashboardCustomDraft.start || !dashboardCustomDraft.end || dashboardCustomDraft.start > dashboardCustomDraft.end || Date.parse(`${dashboardCustomDraft.end}T00:00:00`) - Date.parse(`${dashboardCustomDraft.start}T00:00:00`) > 30 * 86_400_000} onClick={() => { const days = Math.round((Date.parse(`${dashboardCustomDraft.end}T00:00:00`) - Date.parse(`${dashboardCustomDraft.start}T00:00:00`)) / 86_400_000) + 1; setDashboardPeriod(days); setDashboardCustomRange(dashboardCustomDraft); setDashboardCustomOpen(false); }}>Apply</button></div>}

              <section className="stat-grid" aria-label="Store performance">
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Total sales</span>
                    <span className="stat-icon lavender">
                      <CircleDollarSign size={16} />
                    </span>
                  </div>
                  <div className="stat-detail">
                    <div className="stat-value">{money(dashboardRangeRevenue)}</div>
                    <div className="stat-foot">Revenue in selected period</div>
                  </div>
                </article>
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Orders</span>
                    <span className="stat-icon mint">
                      <ClipboardList size={16} />
                    </span>
                  </div>
                  <div className="stat-detail">
                    <div className="stat-value">{dashboardRangeOrders}</div>
                    <div className="stat-foot">Orders in selected period</div>
                  </div>
                </article>
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Products in stock</span>
                    <span className="stat-icon peach">
                      <Boxes size={17} />
                    </span>
                  </div>
                  <div className="stat-detail">
                    <div className="stat-value">
                      {products.reduce((sum, product) => sum + product.stock, 0)}
                      <small> units</small>
                    </div>
                    <div className="stat-foot">Available inventory units</div>
                  </div>
                </article>
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Low stock</span>
                    <span className="stat-icon rose">
                      <Tag size={17} />
                    </span>
                  </div>
                  <div className="stat-detail">
                    <div className="stat-value stat-low-stock-number">{lowStock.length + outOfStock.length}<small> items</small></div>
                    <div className="stat-foot">{lowStock.length + outOfStock.length ? "Items to restock" : "All stock healthy"}</div>
                    <div className="stat-low-stock-bottom"><button type="button" onClick={() => { setInventoryLowStockOnly(true); goToPage("inventory"); }}>Review inventory <ArrowUpRight size={14} /></button></div>
                  </div>
                </article>
              </section>

              <section className="dashboard-grid">
                <article className="panel recent-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent sales</h2>
                      <p>{allSalesCount} transactions recorded</p>
                    </div>
                    <input className="dashboard-sales-search" aria-label="Search recent sales" placeholder="Search customer or product" value={dashboardSalesQuery} onChange={(event) => setDashboardSalesQuery(event.target.value)} />
                    <button
                      className="text-button"
                      onClick={() => goToPage("sales")}
                    >
                      View all <ArrowUpRight size={14} />
                    </button>
                  </div>
                  {allSalesCount === 0 ? (
                    <div className="empty-state">
                      No sales yet. Start a checkout to see transactions here.
                    </div>
                  ) : (
                    <>
                    <div className="sales-table-head"><span>Customer</span><span>Product</span><span>Amount</span><span>Status</span><span>Date</span></div>
                    <div className="sales-list">
                      {sales.filter((sale) => `${sale.customerName ?? "Walk-in customer"} ${sale.firstProductName ?? sale.itemsDetail?.map((item) => item.productName ?? item.name).join(" ") ?? ""} ${sale.id}`.toLowerCase().includes(dashboardSalesQuery.toLowerCase())).slice(0, 5).map((sale) => (
                        <div className="sale-row dashboard-sale-row" key={sale.id}>
                          <span className="customer-initials">{(sale.customerName ?? "Walk-in").split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>
                          <div className="sale-details">
                            <strong>{sale.customerName ?? "Walk-in customer"}</strong>
                            <span>#{String(sale.id).slice(-8)}</span>
                          </div>
                          <span className="sale-product-name">{sale.firstProductName || sale.itemsDetail?.[0]?.productName || sale.itemsDetail?.[0]?.name || `${sale.items} items`}</span>
                          <strong className="sale-total">
                            {money(sale.total)}
                          </strong>
                          <span className="sale-status">{sale.status ?? "Completed"}</span>
                          <span className="sale-date">{timeLabel(sale.date)}</span>
                        </div>
                      ))}
                    </div>
                    </>
                  )}
                </article>
                <article className="panel inventory-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Inventory health</h2>
                      <p>{products.length ? `${Math.round((inStock.length / products.length) * 100)}% of products are well stocked` : "Stock levels by availability"}</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => goToPage("inventory")}
                    >
                      Inventory <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <div className="inventory-health-bar" aria-label={`Healthy ${inStock.length}, low stock ${lowStock.length}, out of stock ${outOfStock.length}`}>
                    <span className="health-good" style={{ width: `${products.length ? inStock.length / products.length * 100 : 0}%` }} />
                    <span className="health-low" style={{ width: `${products.length ? lowStock.length / products.length * 100 : 0}%` }} />
                    <span className="health-out" style={{ width: `${products.length ? outOfStock.length / products.length * 100 : 0}%` }} />
                  </div>
                  <div className="stock-summary">
                    <div
                      className="stock-donut"
                      role="img"
                      aria-label={`Stock overview: ${inStock.length} in stock, ${lowStock.length} low stock, ${outOfStock.length} out of stock`}
                      style={{
                        "--in-stock-stop": `${inStockStop}%`,
                        "--low-stock-stop": `${lowStockStop}%`,
                      }}
                    >
                      <span>
                        {products.length}
                        <small>SKUs</small>
                      </span>
                    </div>
                    <div className="stock-legend">
                      <div>
                        <i className="legend-dot in-stock" />
                        <span>Healthy stock</span>
                        <strong>{inStock.length}</strong>
                      </div>
                      <div>
                        <i className="legend-dot low-stock" />
                        <span>Low stock</span>
                        <strong>{lowStock.length}</strong>
                      </div>
                      <div>
                        <i className="legend-dot out-stock" />
                        <span>Out of stock</span>
                        <strong>{outOfStock.length}</strong>
                      </div>
                    </div>
                  </div>
                  <button
                    className="stock-alert"
                    onClick={() => goToPage("inventory")}
                  >
                    <span className="alert-dot" />
                    <span>
                      {lowStock.length + outOfStock.length
                        ? `${lowStock.length + outOfStock.length} products need restocking`
                        : "All products are well stocked"}
                    </span>
                    <ChevronDown size={15} className="alert-chevron" />
                  </button>
                </article>
              </section>

              <section className="dashboard-insights-grid">
                <article className="panel insight-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Sales overview</h2>
                     
                    </div>
                    <div className="dashboard-chart-tabs"><button type="button" className={dashboardChartMode === "revenue" ? "is-active" : ""} onClick={() => setDashboardChartMode("revenue")}>Revenue</button><button type="button" className={dashboardChartMode === "orders" ? "is-active" : ""} onClick={() => setDashboardChartMode("orders")}>Orders</button></div>
                  </div>
                  <div className="trend-chart-summary"><span>{dashboardChartMode === "revenue" ? "Revenue" : "Orders"}</span><strong>{dashboardChartMode === "revenue" ? money(dashboardRangeRevenue) : dashboardRangeOrders.toLocaleString()}</strong><small>{dashboardKpiTrend.length} days</small></div>
                  <SalesTrendChart entries={dashboardKpiTrend} mode={dashboardChartMode} money={money} />
                </article>

                <article className="panel insight-panel payment-insight-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Stock health</h2>
                      <p>Products by availability</p>
                    </div>
                    <span className="insight-icon">
                      <Banknote size={16} />
                    </span>
                  </div>
                  <div className="inventory-health-list">
                    {[{ label: "Healthy stock", count: inStock.length, units: inStock.reduce((sum, p) => sum + p.stock, 0), tone: "good" }, { label: "Low stock", count: lowStock.length, units: lowStock.reduce((sum, p) => sum + p.stock, 0), tone: "low" }, { label: "Out of stock", count: outOfStock.length, units: 0, tone: "out" }].map((item) => <div className="inventory-health-row" key={item.label}><span className={`health-dot ${item.tone}`} /><span className="health-copy"><strong>{item.label}</strong><small>{item.count} products · {item.units} units</small></span><strong>{products.length ? `${Math.round(item.count / products.length * 100)}%` : "0%"}</strong></div>)}
                  </div>
                  <div className="stock-value-row"><span>Stock value at cost</span><strong>{money(products.reduce((sum, product) => sum + Number(product.costPrice || 0) * Number(product.stock || 0), 0))}</strong></div>
                </article>
              </section>

              <DashboardInventoryWatch
                bestSellers={dashboardInsights.bestSellers}
                products={products}
                lowStock={[...lowStock, ...outOfStock]}
                recentSales={sales}
                money={money}
                onNavigate={goToPage}
              />
            </>
          )}

          {page === "settings" && ["owner", "manager"].includes(user?.role) && (
            <section className="settings-heading">
              <div>
                <h1>Settings</h1>
                <p className="page-subtitle">
                  Set up branch details here. Assign managers and cashiers from
                  the Team section.
                </p>
              </div>
              <div
                className="settings-tabs"
                role="tablist"
                aria-label="Settings sections"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={settingsSection === "stores"}
                  className={settingsSection === "stores" ? "is-active" : ""}
                  onClick={() => setSettingsSection("stores")}
                >
                  <Building2 size={16} /> Stores
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={settingsSection === "team"}
                  className={settingsSection === "team" ? "is-active" : ""}
                  onClick={() => setSettingsSection("team")}
                >
                  <Users size={16} /> Team
                </button>
              </div>
            </section>
          )}

          {page === "settings" && settingsSection === "stores" && ["owner", "manager"].includes(user?.role) && (
            <StoresPage
              stores={managementStores}
              role={user?.role}
              isDemo={isDemo}
              storeLabel={storeLabel}
              onAdd={() => { setEditingStore(null); setShowStoreForm(true); }}
              onEdit={(store) => { setEditingStore(store); setShowStoreForm(true); }}
              onToggleStatus={(store) => void toggleStoreStatus(store)}
            />
          )}
          {page === "settings" && settingsSection === "team" && ["owner", "manager"].includes(user?.role) && (
            <TeamPage
              members={team}
              role={user?.role}
              busyId={teamActionBusyId}
              storeLabel={storeLabel}
              onAdd={() => openTeamForm()}
              onEdit={(member) => openTeamForm(member)}
              onResetPassword={(member) => void resetTeamMemberPassword(member)}
              onToggleStatus={(member) => void toggleCashierStatus(member)}
            />
          )}
          {page === "suppliers" && canManageInventory && (
            <SuppliersPage
              suppliers={suppliers}
              canManageCatalog={canManageCatalog}
              onAdd={() => { setEditingSupplier(null); setShowSupplierForm(true); }}
              onEdit={(supplier) => { setEditingSupplier(supplier); setShowSupplierForm(true); }}
            />
          )}

          {page === "categories" && canManageInventory && (
            <CategoriesPage
              categories={inventoryCategories}
              products={products}
              canManageCatalog={canManageCatalog}
              onAdd={() => { setEditingCategory(null); setShowCategoryForm(true); }}
              onEdit={(category) => { setEditingCategory(category); setShowCategoryForm(true); }}
            />
          )}
          {page === "customers" && (
            <CustomersPage
              customers={filterCustomers(customers, customerSearch)}
              search={customerSearch}
              onSearchChange={setCustomerSearch}
              onAdd={() => { setEditingCustomer(null); setShowCustomerForm(true); }}
              onEdit={(customer) => { setEditingCustomer(customer); setShowCustomerForm(true); }}
              onHistory={(customer) => void viewCustomerHistory(customer)}
            />
          )}

          {page === "customer-history" && viewingCustomerHistory && (
            <CustomerHistoryPage
              customer={viewingCustomerHistory}
              sales={customerHistory}
              total={customerHistoryTotal}
              page={customerHistoryPage}
              busy={customerHistoryBusy}
              formatMoney={money}
              onBack={() => setPage("customers")}
              onPageChange={(pageNumber) => void loadCustomerHistoryPage(pageNumber)}
            />
          )}
          {page === "checkout" && (
            <>
              <section className="welcome-row compact-welcome pos-page-heading">
                <div>
                  <p className="pos-section-kicker">SALES REGISTER</p>
                  <h1>{pageTitle}</h1>
                  <p className="page-subtitle">
                    Build the order, confirm payment, and complete the sale.
                  </p>
                </div>
                <div className="register-status">
                  <span className="online-dot" /> Register open
                </div>
              </section>
              <section className="checkout-layout pos-checkout-layout" aria-label="Checkout workspace">
                <CheckoutCatalog
                  products={availableCheckoutProducts}
                  productSearchTerm={productSearchTerm}
                  productSearchRef={productSearchRef}
                  query={query}
                  onQueryChange={setQuery}
                  onScanSku={addScannedProduct}
                  checkoutLocked={checkoutLocked}
                  onAddProduct={addToCart}
                  formatMoney={money}
                />

                <aside
                  ref={cartPanelRef}
                  className={`cart-panel pos-order-panel${mobileCartExpanded ? "" : " cart-panel--mobile-collapsed"}`}
                  aria-label="Current order and payment"
                >
                  <div className="cart-heading pos-order-header">
                    <div>
                      <h2>
                        Cart ({cartCount} {cartCount === 1 ? "item" : "items"})
                      </h2>
                      <span className="mobile-cart-total">{money(total)}</span>
                    </div>
                    <button
                      type="button"
                      className="mobile-cart-toggle"
                      aria-expanded={mobileCartExpanded}
                      onClick={() =>
                        setMobileCartExpanded((expanded) => !expanded)
                      }
                    >
                      {mobileCartExpanded ? "Collapse" : "Review order"}
                      <ChevronDown
                        size={15}
                        className={mobileCartExpanded ? "is-expanded" : ""}
                      />
                    </button>
                    <div className="checkout-order-actions">
                      <button
                        type="button"
                        className="hold-order-button"
                        aria-label="Hold Order"
                        title="Hold Order"
                        disabled={!cart.length || checkoutLocked}
                        onClick={holdOrder}
                      >
                        <Pause size={14} /> Hold
                      </button>
                      <button
                        type="button"
                        className="cancel-sale-button"
                        aria-label="Cancel Sale"
                        title="Cancel Sale"
                        disabled={!cart.length || checkoutLocked}
                        onClick={cancelSale}
                      >
                        <Trash2 size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                  <div className="checkout-select-row pos-order-customer">
                    <CheckoutCustomerPicker
                      customers={customers}
                      selectedCustomerId={selectedCustomerId}
                      disabled={checkoutLocked}
                      onSelect={setSelectedCustomerId}
                      onAddCustomer={() => {
                        setEditingCustomer(null);
                        setShowCustomerForm(true);
                      }}
                    />
                  </div>
                  {heldOrders.length > 0 && (
                    <section className="held-orders">
                      <h3>
                        Held orders <span>{heldOrders.length}</span>
                      </h3>
                      {heldOrders.map((order, index) => (
                        <div className="held-order-row" key={order.id}>
                          <div>
                            <strong>Order {heldOrders.length - index}</strong>
                            <span>
                              {order.items.reduce(
                                (count, item) => count + item.quantity,
                                0,
                              )}{" "}
                              items ·{" "}
                              {money(
                                order.items.reduce(
                                  (sum, item) =>
                                    sum +
                                    saleUnitPriceCents(item, item.quantity) *
                                      item.quantity /
                                      100,
                                  0,
                                ),
                              )}
                            </span>
                          </div>
                          <button
                            type="button"
                            aria-label={`Resume held order ${heldOrders.length - index}`}
                            disabled={checkoutLocked}
                            onClick={() => resumeHeldOrder(order.id)}
                          >
                            <Play size={13} /> Resume
                          </button>
                          <button
                            type="button"
                            className="held-order-cancel"
                            aria-label={`Cancel held order ${heldOrders.length - index}`}
                            disabled={checkoutLocked}
                            onClick={() => cancelHeldOrder(order.id)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </section>
                  )}
                  {quoteReview && (
                    <div className="quote-review-notice" role="alert">
                      <div>
                        <strong>
                          {quoteReview.available
                            ? "Price or stock changed"
                            : "Stock availability changed"}
                        </strong>
                        <span>
                          Previous total{" "}
                          {money(quoteReview.previousTotalCents / 100)}
                          {" · "}Current total{" "}
                          {money(quoteReview.nextTotalCents / 100)}
                        </span>
                        {!quoteReview.available && (
                          <span>
                            {quoteReview.unavailableNames?.length
                              ? `Removed unavailable items: ${quoteReview.unavailableNames.join(", ")}.`
                              : "Adjust quantities to continue."}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={!cartHasAvailableStock || saleBusy}
                        onClick={() => setQuoteReview(null)}
                      >
                        {quoteReview.available
                          ? "Review and accept"
                          : "Continue"}
                      </button>
                    </div>
                  )}
                  <div className="cart-items pos-order-items">
                    {cart.length === 0 ? (
                      <div className="cart-empty">
                        <div className="cart-empty-icon">
                          <ShoppingCart size={23} />
                        </div>
                        <strong>Your order is empty</strong>
                        <span>
                          Add products from the catalog to get started.
                        </span>
                      </div>
                    ) : (
                      cart.map((item) => {
                        const unitPriceCents = saleUnitPriceCents(item, item.quantity);
                        const unitPrice = unitPriceCents / 100;
                        return (
                          <div className="cart-item pos-order-line" key={item.id}>
                            <ProductArtwork product={item} compact />
                            <div className="cart-item-copy">
                              <strong>{item.name}</strong>
                              <span>
                                {money(unitPrice)} each
                                {unitPrice < item.price ? " · Wholesale price applied" : ""}
                              </span>
                            </div>
                            <strong className="cart-line-total">
                              {money((unitPriceCents * item.quantity) / 100)}
                            </strong>
                            <button
                              type="button"
                              className="cart-item-remove"
                              aria-label={`Delete ${item.name} from order`}
                              title={`Delete ${item.name}`}
                              disabled={checkoutLocked}
                              onClick={() =>
                                setCart((items) => removeCartItem(items, item.id))
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                            <div className="quantity-control">
                              <button
                                type="button"
                                aria-label={`Remove one ${item.name}`}
                                disabled={checkoutLocked}
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus size={12} />
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                type="button"
                                aria-label={`Add one ${item.name}`}
                                disabled={checkoutLocked}
                                onClick={() =>
                                  addToCart(
                                    products.find(
                                      (product) => product.id === item.id,
                                    ),
                                  )
                                }
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="pos-order-footer">
                  <div className="order-summary pos-order-summary">
                    <div className="summary-total">
                      <span>Total</span>
                      <strong>{money(total)}</strong>
                    </div>
                  </div>
                  <section className="payment-card pos-order-payment" aria-label="Payment method">
                    <div className="payment-card-heading">
                      <div>
                        <h3>Payment method</h3>
                      </div>
                      <div className="payment-method-options">
                        <div className="payment-method-option is-selected">
                          <Banknote size={15} />
                          <span>Cash</span>
                        </div>
                      </div>
                    </div>
                    <div className="cash-tender-fields">
                      <label>
                        Amount received
                        <span className="cash-amount-input">
                          <span>GHS</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={checkoutLocked}
                            value={cashReceived}
                            onChange={(event) =>
                              setCashReceived(event.target.value)
                            }
                            placeholder="0.00"
                            aria-label="Cash amount received"
                          />
                          <button
                            type="button"
                            disabled={checkoutLocked}
                            onClick={() =>
                              setCashReceived((totalCents / 100).toFixed(2))
                            }
                          >
                            Exact Amount
                          </button>
                        </span>
                      </label>
                      <div className="change-display">
                        <span>Change to return</span>
                        <strong>{money(changeToReturn)}</strong>
                      </div>
                    </div>
                  </section>
                  <button
                    className="charge-button pos-order-submit"
                    disabled={!canCompleteSale}
                    onClick={completeSale}
                  >
                    <Banknote size={17} />
                    {saleBusy
                      ? "Completing sale…"
                      : `Complete Sale · ${money(total)}`}{" "}
                  </button>
                  </div>
                </aside>
              </section>
              {!mobileCartExpanded && <div className="mobile-checkout-bar">
                <div>
                  <span>
                    {cartCount} {cartCount === 1 ? "item" : "items"}
                  </span>
                  <strong>{money(total)}</strong>
                </div>
                <button
                  type="button"
                  disabled={!cart.length}
                  onClick={() => {
                    setMobileCartExpanded(true);
                    requestAnimationFrame(() =>
                      cartPanelRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      }),
                    );
                  }}
                >
                  Review &amp; pay <ChevronDown size={16} />
                </button>
              </div>}
            </>
          )}

          {page === "inventory" && (
            <>
              <section className="welcome-row">
                <div>
                  <h1>{pageTitle}</h1>
                  <p className="page-subtitle">
                    Track products, stock levels and prices in one place.
                  </p>
                </div>
                {canManageCatalog && (
                  <button
                    className="primary-button"
                    onClick={() => {
                      setEditingProduct(null);
                      setShowProductForm(true);
                    }}
                  >
                    <Plus size={17} /> Add Product
                  </button>
                )}
              </section>
              <section className="inventory-stats">
                <div>
                  <span>Total products</span>
                  <strong>{products.length}</strong>
                  <small>in your catalog</small>
                </div>
                <div>
                  <span>Total units</span>
                  <strong>
                    {products.reduce((sum, product) => sum + product.stock, 0)}
                  </strong>
                  <small>across all products</small>
                </div>
                <div>
                  <span>Low stock</span>
                  <strong className="metric-warning">
                    {lowStock.length + outOfStock.length}
                  </strong>
                  <small>need attention</small>
                </div>
                <div>
                  <span>
                    {canManageInventory
                      ? "Inventory cost value"
                      : "Inventory retail value"}
                  </span>
                  <strong>
                    {money(
                      products.reduce(
                        (sum, product) =>
                          sum +
                          (canManageInventory
                            ? product.costPrice
                            : product.price) *
                            product.stock,
                        0,
                      ),
                    )}
                  </strong>
                  <small>
                    {canManageInventory ? "at cost price" : "at selling price"}
                  </small>
                </div>
              </section>
              {canManageInventory && (
                <div className="inventory-actions-row">
                  <button
                    className="text-button"
                    onClick={() => goToPage("stock-report")}
                  >
                    <BarChart3 size={15} /> View stock report{" "}
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              )}
              <InventoryTable
                products={products}
                filteredProducts={filteredInventory}
                productsRef={inventoryProductsRef}
                lowStockOnly={inventoryLowStockOnly}
                onToggleLowStock={() => setInventoryLowStockOnly((active) => !active)}
                search={inventoryQuery}
                onSearchChange={setInventoryQuery}
                canManageInventory={canManageInventory}
                canManageCatalog={canManageCatalog}
                formatMoney={money}
                onEditProduct={(product) => {
                  setEditingProduct(product);
                  setShowProductForm(true);
                }}
                onManageStock={setStockProduct}
              />
            </>
          )}

          {page === "stock-report" && user?.role !== "cashier" && (
            <>
              <section className="welcome-row">
                <div>
                  <h1>{pageTitle}</h1>
                  <p className="page-subtitle">
                    Review stock levels, expiry dates, and inventory value.
                  </p>
                </div>
                <div className="report-actions">
                  <button
                    className="secondary-button report-print-action"
                    onClick={printReport}
                    disabled={!stockReport || reportBusy}
                  >
                    <Printer size={15} /> Print / Save PDF
                  </button>
                </div>
              </section>
              <p className="report-print-meta">
                Store: {activeStoreName} · Generated {reportGeneratedAt}
              </p>
              {!stockReport ? (
                <div className="panel report-loading">
                  {reportBusy
                    ? "Loading stock report…"
                    : "Stock report is unavailable. Try refreshing."}
                </div>
              ) : (
                <>
                  <section className="inventory-stats report-stats">
                    <div>
                      <span>Products / units</span>
                      <strong>
                        {stockReport.summary.productCount} /{" "}
                        {stockReport.summary.totalUnits}
                      </strong>
                      <small>active catalog</small>
                    </div>
                    <div>
                      <span>Low stock</span>
                      <strong className="metric-warning">
                        {stockReport.summary.lowStockCount}
                      </strong>
                      <small>at or below reorder level</small>
                    </div>
                    <div>
                      <span>Out of stock</span>
                      <strong className="metric-warning">
                        {stockReport.summary.outOfStockCount}
                      </strong>
                      <small>currently unavailable</small>
                    </div>
                    <div>
                      <span>Expired / expiring</span>
                      <strong>
                        {stockReport.summary.expiredCount} /{" "}
                        {stockReport.summary.expiringSoonCount}
                      </strong>
                      <small>
                        within {stockReport.expiringWithinDays} days
                      </small>
                    </div>
                    <div>
                      <span>Inventory at cost</span>
                      <strong>{money(stockReport.summary.costValue)}</strong>
                      <small>estimated stock cost</small>
                    </div>
                    <div>
                      <span>Inventory at retail</span>
                      <strong>{money(stockReport.summary.retailValue)}</strong>
                      <small>potential selling value</small>
                    </div>
                  </section>
                  <section className="dashboard-grid report-grid">
                    <article className="panel inventory-table-panel">
                      <div className="table-heading">
                        <div>
                          <h2>Reorder attention</h2>
                          <p>Products at or below their reorder level</p>
                        </div>
                      </div>
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>PRODUCT</th>
                              <th>SKU</th>
                              <th>STOCK</th>
                              <th>REORDER LEVEL</th>
                              <th>SUPPLIER</th>
                              <th>STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stockReport.lowStock.map((product) => (
                              <tr key={product.id}>
                                <td>
                                  <strong>{product.name}</strong>
                                </td>
                                <td className="sku-cell">{product.sku}</td>
                                <td>{product.stock}</td>
                                <td>{product.reorderLevel}</td>
                                <td>{product.supplier || "—"}</td>
                                <td>
                                  <span
                                    className={`status-pill ${product.stock === 0 ? "status-out" : "status-low"}`}
                                  >
                                    <i />
                                    {product.stock === 0
                                      ? "Out of stock"
                                      : "Reorder"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {stockReport.lowStock.length === 0 && (
                              <tr>
                                <td colSpan="6" className="table-empty">
                                  Everything is above reorder level.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </article>
                    <article className="panel inventory-table-panel">
                      <div className="table-heading">
                        <div>
                          <h2>Expiry watch</h2>
                          <p>
                            Expired or expiring within{" "}
                            {stockReport.expiringWithinDays} days
                          </p>
                        </div>
                      </div>
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>PRODUCT</th>
                              <th>SKU</th>
                              <th>EXPIRY DATE</th>
                              <th>STOCK</th>
                              <th>STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stockReport.expiring.map((product) => (
                              <tr key={product.id}>
                                <td>
                                  <strong>{product.name}</strong>
                                </td>
                                <td className="sku-cell">{product.sku}</td>
                                <td>{product.expiryDate}</td>
                                <td>{product.stock}</td>
                                <td>
                                  <span
                                    className={`status-pill ${product.expiryDate < new Date().toISOString().slice(0, 10) ? "status-out" : "status-low"}`}
                                  >
                                    <CalendarDays size={12} />
                                    {product.expiryDate <
                                    new Date().toISOString().slice(0, 10)
                                      ? "Expired"
                                      : "Expiring"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {stockReport.expiring.length === 0 && (
                              <tr>
                                <td colSpan="5" className="table-empty">
                                  No products expiring in the selected window.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  </section>
                  <section className="panel inventory-table-panel movement-panel">
                    <div className="table-heading">
                      <div>
                        <h2>Recent stock movements</h2>
                        <p>Adjustments and completed sales, latest 100</p>
                      </div>
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>PRODUCT</th>
                            <th>SKU</th>
                            <th>CHANGE</th>
                            <th>REASON</th>
                            <th>UPDATED BY</th>
                            <th>DATE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockReport.movements.map((movement) => (
                            <tr key={movement.id}>
                              <td>
                                <strong>{movement.productName}</strong>
                              </td>
                              <td className="sku-cell">{movement.sku}</td>
                              <td
                                className={
                                  movement.quantity > 0
                                    ? "movement-in"
                                    : "movement-out"
                                }
                              >
                                {movement.quantity > 0 ? "+" : ""}
                                {movement.quantity}
                              </td>
                              <td>{movement.reason}</td>
                              <td>{movement.userName}</td>
                              <td>
                                {new Intl.DateTimeFormat("en-GH", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                }).format(movement.date)}
                              </td>
                            </tr>
                          ))}
                          {stockReport.movements.length === 0 && (
                            <tr>
                              <td colSpan="6" className="table-empty">
                                No stock adjustments recorded yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
            </>
          )}

          {page === "sales" && (
            <SalesPage
              title={pageTitle}
              storeName={activeStoreName}
              generatedAt={reportGeneratedAt}
              sales={displayedTransactions}
              total={transactionTotal}
              page={salesPage}
              pageCount={transactionPages}
              dateFrom={salesDateFrom}
              dateTo={salesDateTo}
              search={transactionQuery}
              busyId={receiptBusyId}
              todayRevenue={todayRevenue}
              todaySaleCount={todaySaleCount}
              allSalesCount={allSalesCount}
              isCashier={user?.role === "cashier" && !isDemo}
              formatMoney={money}
              onPrintReport={printReport}
              onNewSale={() => goToPage("checkout")}
              onDateFromChange={(value) => { setSalesPage(1); setSalesDateFrom(value); }}
              onDateToChange={(value) => { setSalesPage(1); setSalesDateTo(value); }}
              onClearDates={() => { setSalesPage(1); setSalesDateFrom(""); setSalesDateTo(""); }}
              onSearchChange={(value) => { setSalesPage(1); setTransactionQuery(value); }}
              onViewSale={(sale) => void openTransactionReceipt(sale)}
              onPrintSale={(sale) => void openTransactionReceipt(sale, true)}
              onPageChange={setSalesPage}
            />
          )}
          <footer className="footer">
            <div className="footer-brand">
              <span className="footer-brand-mark">
                <ShoppingBag size={16} aria-hidden="true" />
              </span>
              <span className="footer-brand-copy">
                <strong>Counterpoint</strong>
                <small>Retail operations workspace</small>
              </span>
            </div>
            <div className="footer-meta">
              <span>© {new Date().getFullYear()} Counterpoint</span>
            </div>
          </footer>
        </div>
      </main>

      {showProductForm && canManageCatalog && (
        <ProductFormDialog
          product={editingProduct}
          categories={inventoryCategories}
          suppliers={suppliers}
          stores={stores}
          activeStoreId={activeStoreId}
          storeLabel={storeLabel}
          onDismiss={() => { setShowProductForm(false); setEditingProduct(null); }}
          onSubmit={createProduct}
          onAddCategory={() => setShowCategoryForm(true)}
          onAddSupplier={() => setShowSupplierForm(true)}
        />
      )}
      {stockProduct && (
        <AccessibleDialog
          className="modal-backdrop"
          labelledBy="stock-dialog-heading"
          onDismiss={() => setStockProduct(null)}
        >
          <form className="product-modal" onSubmit={manageStock}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">STOCK MANAGEMENT · {stockProduct.sku}</p>
                <h2 id="stock-dialog-heading">Adjust Stock</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                onClick={() => setStockProduct(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="stock-current">
              <Boxes size={17} /> Current stock{" "}
              <strong>{stockProduct.stock} units</strong>
            </div>
            <label>
              Adjustment
              <select name="direction" defaultValue="add">
                <option value="add">Receive Stock (Add)</option>
                <option value="remove">Remove Stock</option>
              </select>
            </label>
            <label>
              Quantity
              <input
                name="quantity"
                type="number"
                min="1"
                max="1000000"
                step="1"
                required
                placeholder="Units"
              />
            </label>
            <label>
              Reason
              <input
                name="reason"
                required
                maxLength="160"
                placeholder="e.g. Supplier delivery, damaged goods, stock count"
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setStockProduct(null)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <PackagePlus size={16} /> Update Stock
              </button>
            </div>
          </form>
        </AccessibleDialog>
      )}

      {showStoreForm && (
        <AccessibleDialog
          className="modal-backdrop"
          labelledBy="store-dialog-heading"
          onDismiss={() => {
            setShowStoreForm(false);
            setEditingStore(null);
          }}
        >
          <form className="product-modal store-modal" onSubmit={createStore}>
            <div className="modal-heading">
              <div>
                <h2 id="store-dialog-heading">
                  {editingStore ? "Edit branch" : "Add a branch"}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                onClick={() => {
                  setShowStoreForm(false);
                  setEditingStore(null);
                }}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Store / Brand Name
              <input
                name="name"
                required
                maxLength="120"
                placeholder="e.g. iSolutions"
                defaultValue={editingStore?.name ?? ""}
              />
            </label>
            <label>
              Branch Name
              <input
                name="branch"
                required
                maxLength="120"
                placeholder="e.g. Accra Central"
                defaultValue={editingStore?.branch ?? ""}
              />
            </label>
            <label>
              Location
              <input
                name="location"
                maxLength="240"
                placeholder="Street, area, city"
                defaultValue={editingStore?.location ?? ""}
              />
            </label>
            <label>
              Contact Phone
              <input
                name="phone"
                type="tel"
                maxLength="40"
                autoComplete="tel"
                placeholder="e.g. +233 20 123 4567"
                defaultValue={editingStore?.phone ?? ""}
              />
            </label>
            <label>
              Contact Email
              <input
                name="email"
                type="email"
                maxLength="254"
                autoComplete="email"
                placeholder="branch@example.com"
                defaultValue={editingStore?.email ?? ""}
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowStoreForm(false);
                  setEditingStore(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                {editingStore ? (
                  <>
                    <Check size={16} /> Save Changes
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Add Store
                  </>
                )}
              </button>
            </div>
          </form>
        </AccessibleDialog>
      )}

      {showTeamForm && (
        <AccessibleDialog
          className="modal-backdrop"
          labelledBy="team-dialog-heading"
          onDismiss={() => {
            setShowTeamForm(false);
            setEditingTeamMember(null);
            setTemporaryPassword("");
          }}
        >
          <form
            key={editingTeamMember?.id ?? "new"}
            className="product-modal"
            onSubmit={createTeamMember}
          >
            <div className="modal-heading">
              <div>
                <h2 id="team-dialog-heading">
                  {editingTeamMember ? "Edit cashier" : "Add a team member"}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                onClick={() => {
                  setShowTeamForm(false);
                  setEditingTeamMember(null);
                  setTemporaryPassword("");
                }}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Full Name
              <input
                name="name"
                required
                maxLength="120"
                placeholder="e.g. Jordan Lee"
                defaultValue={editingTeamMember?.name ?? ""}
              />
            </label>
            <label>
              Email Address
              <input
                name="email"
                type="email"
                required
                maxLength="254"
                placeholder="jordan@yourstore.com"
                defaultValue={editingTeamMember?.email ?? ""}
              />
            </label>
            {!editingTeamMember && (
              <>
                <label>
                  Temporary password
                  <span className="auth-password-field team-password-field">
                    <input
                      name="password"
                      type={showTemporaryPassword ? "text" : "password"}
                      value={temporaryPassword}
                      readOnly
                      required
                      minLength="8"
                      maxLength="72"
                      autoComplete="new-password"
                      aria-label="System-generated temporary password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label={
                        showTemporaryPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      aria-pressed={showTemporaryPassword}
                      onClick={() =>
                        setShowTemporaryPassword((visible) => !visible)
                      }
                    >
                      {showTemporaryPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </span>
                  <div className="temporary-password-actions">
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        setTemporaryPassword(generateTemporaryPassword())
                      }
                    >
                      <RefreshCw size={13} /> New Password
                    </button>
                  </div>
                </label>
                <label>
                  Role
                  <select name="role" required defaultValue="cashier">
                    <option value="cashier">Cashier</option>
                    {user?.role === "owner" && (
                      <option value="manager">Manager</option>
                    )}
                  </select>
                </label>
              </>
            )}
            <label>
              Assigned Store
              <select
                name="storeIds"
                required
                defaultValue={
                  editingTeamMember
                    ? String(editingTeamMember.stores?.[0]?.id ?? activeStoreId)
                    : activeStoreId
                }
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {storeLabel(store)}
                  </option>
                ))}
              </select>
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowTeamForm(false);
                  setEditingTeamMember(null);
                  setTemporaryPassword("");
                }}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                {editingTeamMember ? (
                  <>
                    <Check size={16} /> Save changes
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Add account
                  </>
                )}
              </button>
            </div>
          </form>
        </AccessibleDialog>
      )}

      {createdCredential && (
        <AccessibleDialog
          labelledBy="credential-heading"
          onDismiss={() => setCreatedCredential(null)}
        >
          <section className="product-modal credential-modal">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">
                  {createdCredential.action === "reset"
                    ? "PASSWORD RESET"
                    : "ACCOUNT CREATED"}
                </p>
                <h2 id="credential-heading">
                  {createdCredential.action === "reset"
                    ? "New temporary password"
                    : "Temporary password"}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close password dialog"
                onClick={() => setCreatedCredential(null)}
              >
                <X size={18} />
              </button>
            </div>
            <p className="form-hint">
              Share this temporary password with {createdCredential.name}. It is
              shown here only once.
            </p>
            <div className="credential-password">
              <code>{createdCredential.password}</code>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  void copyTemporaryPassword(createdCredential.password)
                }
              >
                <Copy size={15} /> Copy
              </button>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => setCreatedCredential(null)}
              >
                Done
              </button>
            </div>
          </section>
        </AccessibleDialog>
      )}

      {showPasswordChange && (
        <AccessibleDialog
          labelledBy="change-password-heading"
          onDismiss={() => setShowPasswordChange(false)}
        >
          <form className="product-modal" onSubmit={changeOwnPassword}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">ACCOUNT SECURITY</p>
                <h2 id="change-password-heading">Change password</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close change password dialog"
                onClick={() => setShowPasswordChange(false)}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Current password
              <input
                type={showPasswordChangeFields ? "text" : "password"}
                name="currentPassword"
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              New password
              <input
                type={showPasswordChangeFields ? "text" : "password"}
                name="newPassword"
                autoComplete="new-password"
                minLength="8"
                maxLength="72"
                required
              />
            </label>
            <label>
              Confirm new password
              <span className="auth-password-field">
                <input
                  type={showPasswordChangeFields ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  minLength="8"
                  maxLength="72"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={
                    showPasswordChangeFields
                      ? "Hide passwords"
                      : "Show passwords"
                  }
                  aria-pressed={showPasswordChangeFields}
                  onClick={() =>
                    setShowPasswordChangeFields((visible) => !visible)
                  }
                >
                  {showPasswordChangeFields ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </span>
              <span className="optional-label">
                Use at least 8 characters. Your new password must differ from
                your current password.
              </span>
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowPasswordChange(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={passwordChangeBusy}
              >
                <KeyRound size={16} />
                {passwordChangeBusy ? "Changing..." : "Change password"}
              </button>
            </div>
          </form>
        </AccessibleDialog>
      )}

      {showSupplierForm && canManageCatalog && (
        <AccessibleDialog
          className="modal-backdrop supplier-modal-backdrop"
          labelledBy="supplier-dialog-heading"
          onDismiss={() => {
            setShowSupplierForm(false);
            setEditingSupplier(null);
          }}
        >
          <form
            className="product-modal"
            key={editingSupplier?.id ?? "new-supplier"}
            onSubmit={createSupplier}
          >
            <div className="modal-heading">
              <div>
                <h2 id="supplier-dialog-heading">
                  {editingSupplier ? "Edit supplier" : "Add a supplier"}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                onClick={() => {
                  setShowSupplierForm(false);
                  setEditingSupplier(null);
                }}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Supplier name
              <input
                name="name"
                required
                maxLength="120"
                placeholder="e.g. Accra Wholesale Ltd."
                defaultValue={editingSupplier?.name ?? ""}
              />
            </label>
            <label>
              Contact person <span className="optional-label">(optional)</span>
              <input
                name="contactName"
                maxLength="120"
                placeholder="e.g. Ama Mensah"
                defaultValue={editingSupplier?.contactName ?? ""}
              />
            </label>
            <label>
              Email <span className="optional-label">(optional)</span>
              <input
                name="email"
                type="email"
                maxLength="254"
                placeholder="orders@supplier.com"
                defaultValue={editingSupplier?.email ?? ""}
              />
            </label>
            <label>
              Phone <span className="optional-label">(optional)</span>
              <input
                name="phone"
                type="tel"
                maxLength="40"
                placeholder="+233 ..."
                defaultValue={editingSupplier?.phone ?? ""}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowSupplierForm(false);
                  setEditingSupplier(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                {editingSupplier ? <Check size={16} /> : <Plus size={16} />}
                {editingSupplier ? "Save Changes" : "Add Supplier"}
              </button>
            </div>
          </form>
        </AccessibleDialog>
      )}

      {showCategoryForm && canManageCatalog && (
        <AccessibleDialog
          className="modal-backdrop supplier-modal-backdrop"
          labelledBy="category-dialog-heading"
          onDismiss={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
        >
          <form
            className="product-modal"
            key={editingCategory?.id ?? "new-category"}
            onSubmit={createCategory}
          >
            <div className="modal-heading">
              <div>
                <h2 id="category-dialog-heading">
                  {editingCategory ? "Edit category" : "Add a category"}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                onClick={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                }}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Category name
              <input
                name="name"
                required
                maxLength="60"
                placeholder="e.g. Beverages"
                defaultValue={editingCategory?.name ?? ""}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                {editingCategory ? <Check size={16} /> : <Plus size={16} />}
                {editingCategory ? "Save Changes" : "Add Category"}
              </button>
            </div>
          </form>
        </AccessibleDialog>
      )}

      {showCustomerForm && (
        <AccessibleDialog
          className="modal-backdrop supplier-modal-backdrop"
          labelledBy="customer-dialog-heading"
          onDismiss={() => {
            setShowCustomerForm(false);
            setEditingCustomer(null);
          }}
        >
          <form
            className="product-modal"
            key={editingCustomer?.id ?? "new-customer"}
            onSubmit={saveCustomer}
          >
            <div className="modal-heading">
              <div>
                <h2 id="customer-dialog-heading">
                  {editingCustomer ? "Edit customer" : "Add a customer"}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                onClick={() => {
                  setShowCustomerForm(false);
                  setEditingCustomer(null);
                }}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Customer name
              <input
                name="name"
                required
                maxLength="120"
                placeholder="e.g. Ama Mensah"
                defaultValue={editingCustomer?.name ?? ""}
              />
            </label>
            <label>
              Phone Number <span className="optional-label"></span>
              <input
                name="phone"
                type="tel"
                maxLength="40"
                placeholder="+233 ..."
                defaultValue={editingCustomer?.phone ?? ""}
              />
            </label>
            <label>
              Email Address <span className="optional-label"></span>
              <input
                name="email"
                type="email"
                maxLength="254"
                placeholder="customer@example.com"
                defaultValue={editingCustomer?.email ?? ""}
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowCustomerForm(false);
                  setEditingCustomer(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                {editingCustomer ? <Check size={16} /> : <Plus size={16} />}
                {editingCustomer ? "Save Changes" : "Add Customer"}
              </button>
            </div>
          </form>
        </AccessibleDialog>
      )}

      {receipt && (
        <AccessibleDialog
          className="modal-backdrop receipt-modal-backdrop"
          labelledBy="receipt-dialog-heading"
          onDismiss={() => setReceipt(null)}
        >
          <section className="product-modal receipt-print">
            <div className="modal-heading receipt-screen-heading">
              <div>
                <p className="eyebrow">SALE COMPLETE</p>
                <h2 id="receipt-dialog-heading">Receipt {receipt.id}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close receipt"
                onClick={() => setReceipt(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="receipt-brand">
              <span className="receipt-brand-mark" aria-hidden="true">
                <Command size={17} />
              </span>
              <strong>
                {stores.find((store) => String(store.id) === activeStoreId)
                  ?.name ?? "Counterpoint"}
              </strong>
              <span>SALES RECEIPT</span>
            </div>
            <div className="receipt-meta">
              <span>
                Receipt <strong>{receipt.id}</strong>
              </span>
              <span>
                Date{" "}
                <strong>
                  {new Intl.DateTimeFormat("en-GH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(receipt.date)}
                </strong>
              </span>
              <span>
                Staff <strong>{receipt.cashierName ?? "—"}</strong>
              </span>
              <span>
                Customer{" "}
                <strong>{receipt.customerName ?? "Walk-in customer"}</strong>
              </span>
              <span>
                Payment <strong>{receipt.method}</strong>
              </span>
              {receipt.method === "Cash" && receipt.cashReceived != null && (
                <>
                  <span>
                    Cash received <strong>{money(receipt.cashReceived)}</strong>
                  </span>
                  <span>
                    Change returned{" "}
                    <strong>{money(receipt.change ?? 0)}</strong>
                  </span>
                </>
              )}

              {receipt.method === "Mobile Money" && (
                <span>
                  Mobile money received{" "}
                  <strong>
                    {money(receipt.mobileMoneyAmount ?? receipt.total)}
                  </strong>
                </span>
              )}
            </div>
            <div className="receipt-lines">
              <div className="receipt-line receipt-line-heading">
                <span>ITEM</span>
                <span>QTY</span>
                <span>AMOUNT</span>
              </div>
              {(receipt.itemsDetail ?? []).map((item, index) => (
                <div className="receipt-line" key={`${receipt.id}-${index}`}>
                  <span>{item.productName ?? item.name}</span>
                  <span>{item.quantity}</span>
                  <span>
                    {money(item.lineTotal ?? item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="receipt-totals">
              <div className="receipt-total">
                <span>Total</span>
                <strong>{money(receipt.total)}</strong>
              </div>
            </div>
            <p className="receipt-thanks">Thank you for shopping with us.</p>
            <div className="modal-actions receipt-screen-actions">
              <button
                className="secondary-button"
                onClick={() => setReceipt(null)}
              >
                Close
              </button>
              <button className="primary-button" onClick={() => window.print()}>
                <Printer size={16} /> Print receipt
              </button>
            </div>
          </section>
        </AccessibleDialog>
      )}

      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export default POS;
