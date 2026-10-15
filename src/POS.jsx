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
import "./POS.css";

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
    discountType: "",
    discountValue: 0,
    discountStartsAt: "",
    discountEndsAt: "",
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
    discountType: "percent",
    discountValue: 10,
    discountStartsAt: "2026-01-01",
    discountEndsAt: "2027-12-31",
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
    discountType: "",
    discountValue: 0,
    discountStartsAt: "",
    discountEndsAt: "",
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
    discountType: "",
    discountValue: 0,
    discountStartsAt: "",
    discountEndsAt: "",
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
    discountType: "",
    discountValue: 0,
    discountStartsAt: "",
    discountEndsAt: "",
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
    discountType: "",
    discountValue: 0,
    discountStartsAt: "",
    discountEndsAt: "",
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
    discountType: "",
    discountValue: 0,
    discountStartsAt: "",
    discountEndsAt: "",
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
    discountType: "",
    discountValue: 0,
    discountStartsAt: "",
    discountEndsAt: "",
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

const navItems = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "checkout", label: "Point of Sale", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", icon: Boxes },
  {
    id: "stock-report",
    label: "Stock Report",
    icon: BarChart3,
    roles: ["owner", "manager"],
  },
  {
    id: "suppliers",
    label: "Suppliers",
    icon: Truck,
    roles: ["owner", "manager"],
  },
  {
    id: "categories",
    label: "Categories",
    icon: Tag,
    roles: ["owner", "manager"],
  },
  { id: "customers", label: "Customers", icon: Users },
  { id: "sales", label: "Sales", icon: ClipboardList },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    roles: ["owner", "manager"],
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

async function requestApi(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...(localStorage.getItem("counterpoint-active-store")
        ? { "X-Store-Id": localStorage.getItem("counterpoint-active-store") }
        : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  let payload = null;
  if (response.headers.get("content-type")?.includes("application/json")) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }
  if (!response.ok) {
    const message =
      payload?.error ??
      (response.status >= 500
        ? `The store service is temporarily unavailable (HTTP ${response.status}).`
        : `The store service returned an unexpected response (HTTP ${response.status}).`);
    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.code ?? "HTTP_ERROR";
    error.quote = payload?.quote;
    throw error;
  }
  if (!payload || typeof payload !== "object") {
    throw new Error("The store service returned an invalid response.");
  }
  return payload;
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
    discountType: product.discountType ?? "",
    discountValue: product.discountValue ?? 0,
    discountStartsAt: product.discountStartsAt ?? "",
    discountEndsAt: product.discountEndsAt ?? "",
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

function saleUnitPrice(product, quantity) {
  const candidates = [Math.round(product.price * 100)];
  if (
    product.wholesaleQuantity > 0 &&
    quantity >= product.wholesaleQuantity &&
    product.wholesalePrice > 0
  )
    candidates.push(Math.round(product.wholesalePrice * 100));
  const today = new Date().toISOString().slice(0, 10);
  const promotionIsActive =
    product.discountType &&
    (!product.discountStartsAt || today >= product.discountStartsAt) &&
    (!product.discountEndsAt || today <= product.discountEndsAt);
  if (promotionIsActive && product.discountValue > 0) {
    const retailPriceCents = Math.round(product.price * 100);
    const promotionPrice =
      product.discountType === "percent"
        ? retailPriceCents -
          Math.round((retailPriceCents * product.discountValue) / 100)
        : retailPriceCents - Math.round(product.discountValue * 100);
    if (promotionPrice > 0) candidates.push(promotionPrice);
  }
  return Math.min(...candidates) / 100;
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
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(value);
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
        page !== "checkout" ||
        !["authenticated", "demo"].includes(mode) ||
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "k" ||
        document.querySelector('[role="dialog"][aria-modal="true"]')
      ) {
        return;
      }
      event.preventDefault();
      productSearchRef.current?.focus();
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
      const params = new URLSearchParams({
        page: String(salesPage),
        pageSize: "50",
      });
      if (search) params.set("search", search);
      if (salesDateFrom) params.set("dateFrom", salesDateFrom);
      if (salesDateTo) params.set("dateTo", salesDateTo);
      requestApi(`/sales?${params}`)
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
      requestApi("/products"),
      requestApi("/sales?page=1&pageSize=50"),
      ["owner", "manager"].includes(activeUser.role)
        ? requestApi("/users")
        : Promise.resolve({ users: [] }),
      ["owner", "manager"].includes(activeUser.role)
        ? requestApi("/suppliers")
        : Promise.resolve({ suppliers: [] }),
      requestApi("/categories"),
      requestApi("/customers"),
      (() => {
        const range = localSalesSummaryRange();
        const params = new URLSearchParams(range);
        return requestApi(`/sales/summary?${params}`);
      })(),
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
    const { stores: availableStores } = await requestApi("/stores");
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
      const { stores: allStores } = await requestApi(
        "/stores?includeInactive=true",
      );
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
    requestApi("/auth/session")
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
  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= product.reorderLevel,
  );
  const outOfStock = products.filter((product) => product.stock === 0);
  const inStock = products.filter(
    (product) => product.stock > product.reorderLevel,
  );
  const stockStatusTotal = inStock.length + lowStock.length + outOfStock.length;
  const inStockStop = stockStatusTotal
    ? (inStock.length / stockStatusTotal) * 100
    : 0;
  const lowStockStop = stockStatusTotal
    ? ((inStock.length + lowStock.length) / stockStatusTotal) * 100
    : 0;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + saleUnitPrice(item, item.quantity) * item.quantity,
    0,
  );
  const total = subtotal;
  const heldOrders = heldOrdersByStore[activeStoreId] ?? [];
  const cashReceivedCents = amountCents(cashReceived);
  const totalCents = amountCents(total) ?? 0;
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
  const dashboardTrendMax = Math.max(
    0,
    ...dashboardTrend.map((entry) => entry.revenue),
  );
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
  const filteredProducts = productSearchTerm
    ? products.filter((product) => {
        const matchesQuery = `${product.name} ${product.sku}`
          .toLowerCase()
          .includes(productSearchTerm);
        return matchesQuery && product.stock > 0;
      })
    : [];
  const filteredInventory = products.filter(
    (product) =>
      (!inventoryLowStockOnly ||
        product.stock === 0 ||
        product.stock <= product.reorderLevel) &&
      `${product.name} ${product.sku} ${product.category} ${product.supplier}`
        .toLowerCase()
        .includes(inventoryQuery.toLowerCase()),
  );
  const filteredTransactions = isDemo
    ? sales.filter((sale) => {
        const matchesSearch =
          `${sale.id} ${sale.cashierName ?? ""} ${sale.customerName ?? "Walk-in customer"} ${sale.method} ${new Date(sale.date).toLocaleString()}`
            .toLowerCase()
            .includes(transactionQuery.trim().toLowerCase());
        const saleDate = localDateKey(sale.date);
        return (
          matchesSearch &&
          (!salesDateFrom || saleDate >= salesDateFrom) &&
          (!salesDateTo || saleDate <= salesDateTo)
        );
      })
    : sales;
  const transactionTotal = isDemo
    ? filteredTransactions.length
    : salesTotalCount;
  const displayedTransactions = isDemo
    ? filteredTransactions.slice((salesPage - 1) * 50, salesPage * 50)
    : filteredTransactions;
  const transactionPages = Math.max(1, Math.ceil(transactionTotal / 50));

  function addToCart(product) {
    if (saleBusy) return;
    const inCart = cart.find((item) => item.id === product.id)?.quantity ?? 0;
    if (inCart >= product.stock) {
      setToast("You’ve reached the available stock for this item.");
      return;
    }
    const existing = cart.find((item) => item.id === product.id);
    setCart((items) =>
      existing
        ? items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...items, { ...product, quantity: 1 }],
    );
  }

  function updateQuantity(productId, amount) {
    if (saleBusy) return;
    setCart((items) =>
      items
        .map((item) => {
          if (item.id !== productId) return item;
          const stock =
            products.find((product) => product.id === productId)?.stock ?? 0;
          return { ...item, quantity: Math.min(stock, item.quantity + amount) };
        })
        .filter((item) => item.quantity > 0),
    );
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
          Math.round(saleUnitPrice(item, item.quantity) * 100) !==
            current.unitPriceCents
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
    const params = new URLSearchParams(localSalesSummaryRange());
    try {
      setSalesSummary(await requestApi(`/sales/summary?${params}`));
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
        const { quote } = await requestApi("/sales/quote", {
          method: "POST",
          body: JSON.stringify({
            items: cart.map(({ id, quantity }) => ({
              productId: id,
              quantity,
            })),
          }),
        });
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
            const unitPrice = saleUnitPrice(item, item.quantity);
            return {
              productName: item.name,
              quantity: item.quantity,
              unitPrice,
              lineTotal: unitPrice * item.quantity,
            };
          }),
        };
      } else {
        const result = await requestApi("/sales", {
          method: "POST",
          headers: {
            "Idempotency-Key": saleIdempotencyRef.current.key,
          },
          body: JSON.stringify(salePayload),
        });
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
        const result = await requestApi(`/sales/${saleId}`);
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
              await requestApi(`/categories/${editingCategory.id}`, {
                method: "PUT",
                body: JSON.stringify({ name }),
              })
            ).category
        : isDemo
          ? { id: Date.now(), name }
          : (
              await requestApi("/categories", {
                method: "POST",
                body: JSON.stringify({ name }),
              })
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
              await requestApi(`/products/${editingProduct.id}`, {
                method: "PUT",
                body: JSON.stringify(apiProductData),
              })
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
              await requestApi("/products", {
                method: "POST",
                body: JSON.stringify(apiProductData),
              })
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
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 1_000_000 ||
      !reason
    ) {
      setToast("Enter a whole-number quantity and adjustment reason.");
      return;
    }
    if (stockProduct.stock + adjustment < 0) {
      setToast("This adjustment would take stock below zero.");
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
        ({ product: updatedProduct } = await requestApi(
          `/products/${stockProduct.id}/stock-adjustments`,
          {
            method: "POST",
            body: JSON.stringify({ quantity: adjustment, reason }),
          },
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
      const { store } = await requestApi(
        storeId ? `/stores/${storeId}` : "/stores",
        {
          method: storeId ? "PUT" : "POST",
          body: JSON.stringify({
            ...storeDetails,
            ...(storeId ? { active: editingStore.active } : {}),
          }),
        },
      );
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
      const { store: savedStore } = await requestApi(`/stores/${store.id}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
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
            await requestApi(`/users/${member.id}/password-reset`, {
              method: "POST",
            })
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
      await requestApi("/auth/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (mode === "password-change-required") {
        const { user: activeUser } = await requestApi("/auth/session");
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
              await requestApi(`/users/${editingTeamMember.id}`, {
                method: "PUT",
                body: JSON.stringify({
                  ...member,
                  active: editingTeamMember.active,
                }),
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
          const result = await requestApi("/users", {
            method: "POST",
            body: JSON.stringify(newMember),
          });
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
            await requestApi(`/users/${member.id}`, {
              method: "PUT",
              body: JSON.stringify({
                name: member.name,
                email: member.email,
                storeIds: (member.stores ?? []).map((store) =>
                  Number(store.id),
                ),
                active: !member.active,
              }),
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
              await requestApi(`/suppliers/${editingSupplier.id}`, {
                method: "PUT",
                body: JSON.stringify(supplier),
              })
            ).supplier
        : isDemo
          ? { ...supplier, id: Date.now(), createdAt: Date.now() }
          : (
              await requestApi("/suppliers", {
                method: "POST",
                body: JSON.stringify(supplier),
              })
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
              await requestApi(`/customers/${editingCustomer.id}`, {
                method: "PUT",
                body: JSON.stringify(customer),
              })
            ).customer
        : isDemo
          ? { ...customer, id: Date.now(), createdAt: Date.now() }
          : (
              await requestApi("/customers", {
                method: "POST",
                body: JSON.stringify(customer),
              })
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
        const result = await requestApi(
          `/customers/${customer.id}/history?page=1&pageSize=50`,
        );
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
        const result = await requestApi(
          `/customers/${viewingCustomerHistory.id}/history?page=${pageNumber}&pageSize=50`,
        );
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
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role),
  );
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
        const { report } = await requestApi("/inventory/report");
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
      const { user: activeUser } = await requestApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
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
      const { user: activeUser } = await requestApi("/auth/session");
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
        await requestApi("/auth/logout", { method: "POST" });
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

  if (mode === "loading") {
    return (
      <div className="auth-screen">
        <div className="auth-card auth-loading">
          <div className="brand-mark">
            <Command size={20} />
          </div>
          <strong>Connecting to your store…</strong>
        </div>
      </div>
    );
  }

  if (mode === "password-change-required") {
    return (
      <div className="auth-screen">
        <form className="auth-card login-card" onSubmit={changeOwnPassword}>
          <div className="login-logo" aria-hidden="true">
            <KeyRound size={30} />
          </div>
          <div className="login-intro">
            <p className="eyebrow login-eyebrow">ACCOUNT SECURITY</p>
            <h1>Set a new password</h1>
            <p className="auth-description">
              Your temporary password must be replaced before you can use the
              account.
            </p>
          </div>
          {authError && (
            <div className="auth-error" role="alert">
              {authError}
            </div>
          )}
          <label>
            New password
            <input
              type={showPasswordChangeFields ? "text" : "password"}
              name="newPassword"
              autoComplete="new-password"
              minLength="8"
              maxLength="72"
              required
              autoFocus
            />
          </label>
          <label>
            Confirm new password
            <input
              type={showPasswordChangeFields ? "text" : "password"}
              name="confirmPassword"
              autoComplete="new-password"
              minLength="8"
              maxLength="72"
              required
            />
          </label>
          <button
            type="button"
            className="auth-demo-link"
            aria-pressed={showPasswordChangeFields}
            onClick={() => setShowPasswordChangeFields((visible) => !visible)}
          >
            {showPasswordChangeFields ? "Hide password" : "Show password"}
          </button>
          <button
            className="primary-button auth-submit"
            disabled={passwordChangeBusy}
          >
            {passwordChangeBusy ? "Changing password…" : "Set new password"}
          </button>
        </form>
      </div>
    );
  }

  if (mode === "auth-error") {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <a className="brand auth-brand" href="#">
            <div className="brand-mark">
              <Command size={20} />
            </div>
            <span>
              counterpoint<span className="brand-period">.</span>
            </span>
          </a>
          <h1>Can’t reach your store</h1>
          <p className="auth-description">
            {authError || "Check that the API server is running and try again."}
          </p>
          <button
            className="primary-button auth-submit"
            onClick={restoreSession}
          >
            Try again
          </button>
          <button className="auth-demo-link" onClick={enterDemo}>
            Explore the local demo instead
          </button>
        </div>
      </div>
    );
  }

  if (mode === "login") {
    return (
      <div className="auth-screen">
        <form className="auth-card login-card" onSubmit={submitLogin}>
          <div className="login-logo" aria-hidden="true">
            <Command size={35} strokeWidth={2.1} />
          </div>
          <div className="login-intro">
            <p className="eyebrow login-eyebrow">WELCOME BACK</p>
            <h1>Sign in to your POS account</h1>
          </div>

          {authError && (
            <div className="auth-error" role="alert">
              {authError}
            </div>
          )}
          <label>
            Email address
            <input
              type="email"
              name="email"
              autoComplete="username"
              placeholder="you@yourstore.com"
              aria-label="Email address"
              required
            />
          </label>
          <label>
            Password
            <span className="auth-password-field">
              <input
                type={showLoginPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                aria-label="Password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={
                  showLoginPassword ? "Hide password" : "Show password"
                }
                aria-pressed={showLoginPassword}
                onClick={() => setShowLoginPassword((visible) => !visible)}
              >
                {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>
          <button className="primary-button auth-submit" disabled={loginBusy}>
            {loginBusy ? "Signing in…" : "Sign in"}
          </button>
          <div className="auth-divider">
            <span>or</span>
          </div>
          <button type="button" className="auth-demo-link" onClick={enterDemo}>
            Explore the local demo
          </button>
        </form>
      </div>
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
          <div className="header-store-picker">
            <Building2 size={17} aria-hidden="true" />
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
                className="avatar-small"
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={showHeaderAccountMenu}
                onClick={() => {
                  setShowHeaderAccountMenu((visible) => !visible);
                }}
              >
                {user?.name
                  ?.split(/\s+/)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
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
                    <span className="dashboard-attention"> · {lowStock.length + outOfStock.length} items need attention</span>
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
                    <div className="stat-main-line">
                      <div className="stat-value">{money(dashboardRangeRevenue)}</div>
                      <div className="sparkline" aria-hidden="true">{dashboardKpiTrend.slice(-7).map((day) => <i key={day.day} style={{ height: `${dashboardKpiTrend.length ? Math.max(12, (day.revenue / Math.max(1, ...dashboardKpiTrend.map((entry) => entry.revenue))) * 100) : 12}%` }} />)}</div>
                    </div>
                    <div className="stat-growth"><strong>{dashboardRangeOrders}</strong><span>orders in selected period</span></div>
                    <div className="stat-submetrics"><span><small>Avg. order</small><strong>{money(dashboardRangeOrders ? dashboardRangeRevenue / dashboardRangeOrders : 0)}</strong></span><span><small>Products</small><strong>{products.length}</strong></span></div>
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
                    <div className="stat-foot">Completed in selected period</div>
                    <div className="stat-order-bars" aria-hidden="true">{dashboardKpiTrend.slice(-7).map((day) => <i key={day.day} style={{ height: `${Math.max(7, dashboardKpiTrend.length ? (day.count / Math.max(1, ...dashboardKpiTrend.map((entry) => entry.count))) * 100 : 7)}%` }} />)}</div>
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
                    <div className="stat-foot">Across {products.length} products</div>
                    <div className="stock-segment-bar" aria-label={`${inStock.length} healthy products, ${lowStock.length} low stock, ${outOfStock.length} out of stock`}><i className="healthy" style={{ width: `${products.length ? inStock.length / products.length * 100 : 0}%` }} /><i className="low" style={{ width: `${products.length ? lowStock.length / products.length * 100 : 0}%` }} /><i className="empty" style={{ width: `${products.length ? outOfStock.length / products.length * 100 : 0}%` }} /></div>
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
                    <div className="stat-warning-pill"><i />{lowStock.length + outOfStock.length ? "Needs attention" : "All stock healthy"}</div>
                    <div className="stat-low-stock-bottom"><div className="stat-product-stack">{[...outOfStock, ...lowStock].slice(0, 3).map((product) => <ProductArtwork key={product.id} product={product} compact />)}</div><button type="button" onClick={() => { setInventoryLowStockOnly(true); goToPage("inventory"); }}>Review <ArrowUpRight size={14} /></button></div>
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
                      {sales.filter((sale) => `${sale.customerName ?? "Walk-in customer"} ${sale.itemsDetail?.map((item) => item.productName ?? item.name).join(" ") ?? ""} ${sale.id}`.toLowerCase().includes(dashboardSalesQuery.toLowerCase())).slice(0, 5).map((sale) => (
                        <div className="sale-row dashboard-sale-row" key={sale.id}>
                          <span className="customer-initials">{(sale.customerName ?? "Walk-in").split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>
                          <div className="sale-details">
                            <strong>{sale.customerName ?? "Walk-in customer"}</strong>
                            <span>#{String(sale.id).slice(-8)}</span>
                          </div>
                          <span className="sale-product-name">{sale.itemsDetail?.[0]?.productName ?? sale.itemsDetail?.[0]?.name ?? `${sale.items} items`}</span>
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
                  <div className="heatmap-summary"><span>Total revenue</span><strong>{money(dashboardRangeRevenue)}</strong><span className="heatmap-order-total">{dashboardRangeOrders} orders</span></div>
                  <div className="sales-heatmap" role="img" aria-label={`Sales ${dashboardChartMode} heatmap for ${dashboardCustomRange ? dashboardPeriod : 30} days`}>
                    <div className="heatmap-axis"><span>{dashboardChartMode === "revenue" ? "High" : "More"}</span><span>Low</span></div>
                    <div className="heatmap-columns" style={{ gridTemplateColumns: `repeat(${dashboardTrend.length}, minmax(10px, 1fr))` }}>
                      {dashboardTrend.map((entry, index) => {
                        const value = dashboardChartMode === "orders" ? entry.count : entry.revenue;
                        const max = dashboardChartMode === "orders" ? Math.max(1, ...dashboardTrend.map((day) => day.count)) : dashboardTrendMax;
                        const level = value ? Math.max(1, Math.ceil((value / max) * 7)) : 0;
                        return <div className="heatmap-column" key={entry.day} title={`${entry.day} · ${entry.count} orders · ${money(entry.revenue)}`}><div className="heatmap-cells">{Array.from({ length: 7 }, (_, cell) => <span key={cell} className={cell >= 7 - level ? `heat-${Math.max(1, Math.ceil(level / 2))}` : ""} />)}</div><small>{index % Math.max(1, Math.ceil(dashboardTrend.length / 7)) === 0 || index === dashboardTrend.length - 1 ? new Date(`${entry.day}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}</small></div>;
                      })}
                    </div>
                  </div>
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

          {page === "settings" &&
            settingsSection === "stores" &&
            ["owner", "manager"].includes(user?.role) && (
              <>
                <section className="welcome-row">
                  <div>
                    <h1>Stores</h1>
                    <p className="page-subtitle">
                      {isDemo
                        ? "Connect a store account to add locations with separate inventory."
                        : user?.role === "owner"
                          ? "Create and edit locations, then assign staff to each store."
                          : "View all store locations. Only an administrator can add or edit stores."}
                    </p>
                  </div>
                  {user?.role === "owner" && (
                    <button
                      className="primary-button"
                      disabled={isDemo}
                      onClick={() => {
                        setEditingStore(null);
                        setShowStoreForm(true);
                      }}
                    >
                      <Plus size={17} /> Add branch
                    </button>
                  )}
                </section>
                <section className="panel inventory-table-panel">
                  <div className="table-heading">
                    <div>
                      <h2>Stores</h2>
                      <p>
                        {managementStores.length} location
                        {managementStores.length === 1 ? "" : "s"} visible to
                        your account
                      </p>
                    </div>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>STORE / BRAND</th>
                          <th>BRANCH &amp; LOCATION</th>
                          <th>CONTACT</th>
                          <th>ACCESS</th>
                          <th>STATUS</th>
                          {user?.role === "owner" && <th>ACTIONS</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {managementStores.map((store) => (
                          <tr key={store.id}>
                            <td>
                              <strong>{store.name}</strong>
                            </td>
                            <td>
                              <strong>{store.branch || "—"}</strong>
                              {store.location && (
                                <small>{store.location}</small>
                              )}
                            </td>
                            <td>
                              {store.phone && <small>{store.phone}</small>}
                              {store.email && <small>{store.email}</small>}
                              {!store.phone && !store.email && "—"}
                            </td>
                            <td>All stores</td>
                            <td>
                              <span
                                className={`status-pill ${store.active ? "status-ok" : "status-out"}`}
                              >
                                <i />
                                {store.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            {user?.role === "owner" && (
                              <td>
                                <div className="row-actions">
                                  <button
                                    type="button"
                                    aria-label={`Edit ${storeLabel(store)}`}
                                    title="Edit branch"
                                    disabled={isDemo}
                                    onClick={() => {
                                      setEditingStore(store);
                                      setShowStoreForm(true);
                                    }}
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`${store.active ? "Deactivate" : "Activate"} ${storeLabel(store)}`}
                                    title={
                                      store.active
                                        ? "Deactivate store"
                                        : "Activate store"
                                    }
                                    disabled={isDemo}
                                    onClick={() =>
                                      void toggleStoreStatus(store)
                                    }
                                  >
                                    {store.active ? (
                                      <X size={14} />
                                    ) : (
                                      <Check size={14} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                        {managementStores.length === 0 && (
                          <tr>
                            <td
                              colSpan={user?.role === "owner" ? 6 : 5}
                              className="table-empty"
                            >
                              No stores found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

          {page === "settings" &&
            settingsSection === "team" &&
            ["owner", "manager"].includes(user?.role) && (
              <>
                <section className="welcome-row">
                  <div>
                    <h1>Team</h1>
                    <p className="page-subtitle">
                      Manage staff accounts and their store roles.
                    </p>
                  </div>
                  <button
                    className="primary-button"
                    onClick={() => openTeamForm()}
                  >
                    <Plus size={17} /> Add team member
                  </button>
                </section>
                <section className="panel inventory-table-panel">
                  <div className="table-heading">
                    <div>
                      <h2>Team members</h2>
                      <p>Manage managers and cashiers across stores.</p>
                    </div>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>NAME</th>
                          <th>EMAIL</th>
                          <th>ROLE</th>
                          <th>STORES</th>
                          <th>STATUS</th>
                          <th>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {team.map((member) => (
                          <tr key={member.id}>
                            <td>
                              <div className="team-person">
                                <div className="profile-avatar">
                                  {member.name
                                    .split(/\s+/)
                                    .map((part) => part[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </div>
                                <strong>{member.name}</strong>
                              </div>
                            </td>
                            <td>{member.email}</td>
                            <td>
                              <span className="role-pill">
                                {member.role === "owner"
                                  ? "Administrator"
                                  : member.role}
                              </span>
                            </td>
                            <td>
                              {(member.stores ?? [])
                                .map(storeLabel)
                                .filter(Boolean)
                                .join(", ") || "—"}
                            </td>
                            <td>
                              <span
                                className={`status-pill ${member.active ? "status-ok" : "status-out"}`}
                              >
                                <i />
                                {member.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                              {member.role === "cashier" ||
                              ((user?.role === "owner" ||
                                user?.role === "manager") &&
                                member.role === "manager") ? (
                                <div className="row-actions">
                                  <button
                                    type="button"
                                    aria-label={`Edit ${member.name}`}
                                    title={`Edit ${member.role}`}
                                    onClick={() => openTeamForm(member)}
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Reset password for ${member.name}`}
                                    title="Reset password"
                                    disabled={
                                      teamActionBusyId === String(member.id)
                                    }
                                    onClick={() =>
                                      void resetTeamMemberPassword(member)
                                    }
                                  >
                                    <KeyRound size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`${member.active ? "Deactivate" : "Activate"} ${member.name}`}
                                    title={
                                      member.active
                                        ? `Deactivate ${member.role}`
                                        : `Activate ${member.role}`
                                    }
                                    disabled={
                                      teamActionBusyId === String(member.id)
                                    }
                                    onClick={() =>
                                      void toggleCashierStatus(member)
                                    }
                                  >
                                    {member.active ? (
                                      <X size={14} />
                                    ) : (
                                      <Check size={14} />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="optional-label">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {team.length === 0 && (
                          <tr>
                            <td colSpan="6" className="table-empty">
                              No team members are assigned to this store.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

          {page === "suppliers" && canManageInventory && (
            <>
              <section className="welcome-row">
                <div>
                  <h1>{pageTitle}</h1>
                  <p className="page-subtitle">
                    Keep supplier details here and assign them to products.
                  </p>
                </div>
                {canManageCatalog && (
                  <button
                    className="primary-button"
                    onClick={() => {
                      setEditingSupplier(null);
                      setShowSupplierForm(true);
                    }}
                  >
                    <Plus size={17} /> Add Supplier
                  </button>
                )}
              </section>
              <section className="panel inventory-table-panel">
                <div className="table-heading">
                  <div>
                    <h2>Supplier directory</h2>
                    <p>
                      {suppliers.length} suppliers available for product
                      selection
                    </p>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>SUPPLIER</th>
                        <th>CONTACT PERSON</th>
                        <th>EMAIL</th>
                        <th>PHONE</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.map((supplier) => (
                        <tr key={supplier.id}>
                          <td>
                            <strong>{supplier.name}</strong>
                          </td>
                          <td>{supplier.contactName || "—"}</td>
                          <td>{supplier.email || "—"}</td>
                          <td>{supplier.phone || "—"}</td>
                          <td>
                            <div className="row-actions">
                              {canManageCatalog && (
                                <button
                                  aria-label={`Edit ${supplier.name}`}
                                  title="Edit supplier"
                                  onClick={() => {
                                    setEditingSupplier(supplier);
                                    setShowSupplierForm(true);
                                  }}
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {suppliers.length === 0 && (
                        <tr>
                          <td colSpan="5" className="table-empty">
                            No suppliers yet. Add one to assign it to products.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {page === "categories" && canManageInventory && (
            <>
              <section className="welcome-row">
                <div>
                  <h1>{pageTitle}</h1>
                  <p className="page-subtitle">
                    Manage the categories available for product classification.
                  </p>
                </div>
                {canManageCatalog && (
                  <button
                    className="primary-button"
                    onClick={() => {
                      setEditingCategory(null);
                      setShowCategoryForm(true);
                    }}
                  >
                    <Plus size={17} /> Add Category
                  </button>
                )}
              </section>
              <section className="panel inventory-table-panel">
                <div className="table-heading">
                  <div>
                    <h2>Product categories</h2>
                    <p>
                      {inventoryCategories.length} categories available when
                      adding products
                    </p>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>CATEGORY</th>
                        <th>PRODUCTS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryCategories.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.name}</strong>
                          </td>
                          <td>
                            {
                              products.filter(
                                (product) => product.category === item.name,
                              ).length
                            }
                          </td>
                          <td>
                            <div className="row-actions">
                              {canManageCatalog && (
                                <button
                                  aria-label={`Edit ${item.name}`}
                                  title="Edit category"
                                  onClick={() => {
                                    setEditingCategory(item);
                                    setShowCategoryForm(true);
                                  }}
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {inventoryCategories.length === 0 && (
                        <tr>
                          <td colSpan="3" className="table-empty">
                            No categories yet. Add one to use it on products.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {page === "customers" && (
            <>
              <section className="welcome-row">
                <div>
                  <h1>{pageTitle}</h1>
                  <p className="page-subtitle">
                    Manage customer contact details and review their purchase
                    history.
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => {
                    setEditingCustomer(null);
                    setShowCustomerForm(true);
                  }}
                >
                  <Plus size={17} /> Add Customer
                </button>
              </section>
              <section className="panel inventory-table-panel">
                <div className="table-heading">
                  <div>
                    <h2>Customers</h2>
                    <p>{customers.length} customer records</p>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>CUSTOMER</th>
                        <th>PHONE</th>
                        <th>EMAIL</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.id}>
                          <td>
                            <strong>{customer.name}</strong>
                          </td>
                          <td>{customer.phone || "—"}</td>
                          <td>{customer.email || "—"}</td>
                          <td>
                            <div className="row-actions">
                              <button
                                aria-label={`Edit ${customer.name}`}
                                title="Edit customer"
                                onClick={() => {
                                  setEditingCustomer(customer);
                                  setShowCustomerForm(true);
                                }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                aria-label={`View history for ${customer.name}`}
                                title="View purchase history"
                                onClick={() =>
                                  void viewCustomerHistory(customer)
                                }
                              >
                                <Clock3 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {customers.length === 0 && (
                        <tr>
                          <td colSpan="4" className="table-empty">
                            No customers yet. Add a customer to associate them
                            with sales.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {page === "customer-history" && viewingCustomerHistory && (
            <>
              <section className="welcome-row">
                <div>
                  <p className="eyebrow">CUSTOMER PURCHASES</p>
                  <h1>{viewingCustomerHistory.name}</h1>
                  <p className="page-subtitle">
                    {viewingCustomerHistory.email ||
                      viewingCustomerHistory.phone ||
                      "Purchase history"}
                  </p>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setPage("customers")}
                >
                  <ArrowLeft size={15} /> Back to customers
                </button>
              </section>
              {customerHistoryBusy ? (
                <div className="panel report-loading">
                  Loading customer history…
                </div>
              ) : (
                <section className="panel inventory-table-panel">
                  <div className="table-heading">
                    <div>
                      <h2>Purchase history</h2>
                      <p>
                        {customerHistoryTotal} completed sales
                        {customerHistoryTotal > customerHistory.length
                          ? ` · showing ${customerHistory.length} on this page`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>ORDER</th>
                          <th>DATE</th>
                          <th>ITEMS</th>
                          <th>PAYMENT</th>
                          <th>TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerHistory.map((sale) => (
                          <tr key={sale.id}>
                            <td>
                              <strong className="order-id">{sale.id}</strong>
                            </td>
                            <td>
                              {new Intl.DateTimeFormat("en-GH", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(sale.date)}
                            </td>
                            <td>{sale.itemCount ?? sale.items}</td>
                            <td>
                              <span className="payment-tag">{sale.method}</span>
                            </td>
                            <td className="price-cell">{money(sale.total)}</td>
                          </tr>
                        ))}
                        {customerHistory.length === 0 && (
                          <tr>
                            <td colSpan="5" className="table-empty">
                              No purchases recorded for this customer.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {customerHistory.map((sale) => (
                    <div
                      className="customer-history-items"
                      key={`${sale.id}-items`}
                    >
                      <strong>{sale.id}</strong>
                      {sale.items?.map((item, index) => (
                        <span key={`${sale.id}-${index}`}>
                          {item.productName ?? item.name} × {item.quantity} —{" "}
                          {money(
                            item.lineTotal ?? item.unitPrice * item.quantity,
                          )}
                        </span>
                      ))}
                    </div>
                  ))}
                  <div className="sales-pagination">
                    <span>
                      {customerHistoryTotal === 0
                        ? "No purchases"
                        : `${(customerHistoryPage - 1) * 50 + 1}–${Math.min(customerHistoryPage * 50, customerHistoryTotal)} of ${customerHistoryTotal}`}
                    </span>
                    <div>
                      <button
                        type="button"
                        disabled={
                          customerHistoryBusy || customerHistoryPage <= 1
                        }
                        onClick={() =>
                          void loadCustomerHistoryPage(customerHistoryPage - 1)
                        }
                      >
                        Previous
                      </button>
                      <span>
                        Page {customerHistoryPage} of{" "}
                        {Math.max(1, Math.ceil(customerHistoryTotal / 50))}
                      </span>
                      <button
                        type="button"
                        disabled={
                          customerHistoryBusy ||
                          customerHistoryPage >=
                            Math.ceil(customerHistoryTotal / 50)
                        }
                        onClick={() =>
                          void loadCustomerHistoryPage(customerHistoryPage + 1)
                        }
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {page === "checkout" && (
            <>
              <section className="welcome-row compact-welcome">
                <div>
                  <h1>{pageTitle}</h1>
                  <p className="page-subtitle">
                    Search for items, build the order, and take payment.
                  </p>
                </div>
                <div className="register-status">
                  <span className="online-dot" /> Register open
                </div>
              </section>
              <section className="checkout-layout">
                <div className="catalog-panel">
                  <div className="catalog-heading">
                    <div>
                      <h2>Find products</h2>
                      <p>Search by product name or SKU</p>
                    </div>
                    {productSearchTerm && (
                      <span className="catalog-result-count" aria-live="polite">
                        {filteredProducts.length}{" "}
                        {filteredProducts.length === 1 ? "item" : "items"} found
                      </span>
                    )}
                  </div>
                  <div className="catalog-toolbar">
                    <div className="catalog-search-control">
                      <label className="search-field">
                        <Search size={18} aria-hidden="true" />
                        <input
                          ref={productSearchRef}
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Search products by name or SKU"
                          aria-label="Search products"
                          aria-controls="checkout-product-results"
                          autoComplete="off"
                        />
                        <kbd>Ctrl / ⌘ K</kbd>
                      </label>
                      {query && (
                        <button
                          type="button"
                          className="search-clear"
                          aria-label="Clear product search"
                          onClick={() => setQuery("")}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="product-grid" id="checkout-product-results">
                    {filteredProducts.map((product) => (
                      <button
                        className="catalog-product"
                        key={product.id}
                        disabled={checkoutLocked}
                        onClick={() => addToCart(product)}
                      >
                        <ProductArtwork product={product} />
                        <span className="catalog-product-info">
                          <strong>{product.name}</strong>
                          <span className="catalog-product-sku">
                            SKU {product.sku}
                          </span>
                          <span className="catalog-price">
                            {money(product.price)}
                          </span>
                        </span>
                        <span
                          className={`stock-count${product.stock <= 5 ? " stock-count--low" : ""}`}
                        >
                          {product.stock} left
                        </span>
                        <span className="add-product-icon">
                          <Plus size={15} />
                        </span>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="empty-state catalog-empty">
                        {productSearchTerm
                          ? "No available products match your search."
                          : "Start typing a product name or SKU to see matching items."}
                      </div>
                    )}
                  </div>
                </div>

                <aside
                  ref={cartPanelRef}
                  className={`cart-panel${mobileCartExpanded ? "" : " cart-panel--mobile-collapsed"}`}
                >
                  <div className="cart-heading">
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
                  <div className="checkout-select-row">
                    <label className="customer-select">
                      <div className="customer-icon">
                        <Users size={17} />
                      </div>
                      <span>
                        <small>Customer</small>
                        <select
                          aria-label="Select customer"
                          value={selectedCustomerId}
                          disabled={checkoutLocked}
                          onChange={(event) =>
                            setSelectedCustomerId(event.target.value)
                          }
                        >
                          <option value="">Walk-in customer</option>
                          {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="customer-select-chevron"
                          size={15}
                          aria-hidden="true"
                        />
                      </span>
                    </label>
                    <button
                      type="button"
                      className="customer-add-button"
                      aria-label="Add customer"
                      title="Add Customer"
                      disabled={checkoutLocked}
                      onClick={() => {
                        setEditingCustomer(null);
                        setShowCustomerForm(true);
                      }}
                    >
                      <Plus size={15} />
                    </button>
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
                                    saleUnitPrice(item, item.quantity) *
                                      item.quantity,
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
                  <div className="cart-items">
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
                        const unitPrice = saleUnitPrice(item, item.quantity);
                        const discountApplied = unitPrice < item.price;
                        return (
                          <div className="cart-item" key={item.id}>
                            <ProductArtwork product={item} compact />
                            <div className="cart-item-copy">
                              <strong>{item.name}</strong>
                              <span>
                                {money(unitPrice)} each
                                {discountApplied ? " · Discount applied" : ""}
                              </span>
                            </div>
                            <strong className="cart-line-total">
                              {money(unitPrice * item.quantity)}
                            </strong>
                            <button
                              type="button"
                              className="cart-item-remove"
                              aria-label={`Delete ${item.name} from order`}
                              title={`Delete ${item.name}`}
                              disabled={checkoutLocked}
                              onClick={() =>
                                setCart((items) =>
                                  items.filter(
                                    (cartItem) => cartItem.id !== item.id,
                                  ),
                                )
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
                  <div className="order-summary">
                    <div className="summary-total">
                      <span>Total</span>
                      <strong>{money(total)}</strong>
                    </div>
                  </div>
                  <section className="payment-card" aria-label="Payment method">
                    <div className="payment-card-heading">
                      <div>
                        <h3>Payment method</h3>
                      </div>
                    </div>
                    <div className="payment-method-options">
                      <div className="payment-method-option is-selected">
                        <Banknote size={15} />
                        <span>Cash</span>
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
                    className="charge-button"
                    disabled={!canCompleteSale}
                    onClick={completeSale}
                  >
                    <Banknote size={17} />
                    {saleBusy
                      ? "Completing sale…"
                      : `Complete Sale · ${money(total)}`}{" "}
                  </button>
                </aside>
              </section>
              <div className="mobile-checkout-bar">
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
              </div>
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
              <section
                ref={inventoryProductsRef}
                id="inventory-products"
                className="panel inventory-table-panel"
                tabIndex={-1}
              >
                <div className="table-heading">
                  <div>
                    <h2>
                      {inventoryLowStockOnly
                        ? "Low-stock products"
                        : "All products"}
                    </h2>
                    <p>
                      {inventoryLowStockOnly
                        ? `${filteredInventory.length} products need replenishment or are out of stock`
                        : `${products.length} products in your catalog`}
                    </p>
                  </div>
                  <div className="inventory-table-actions">
                    <button
                      type="button"
                      className={`inventory-low-stock-toggle${inventoryLowStockOnly ? " is-active" : ""}`}
                      aria-pressed={inventoryLowStockOnly}
                      onClick={() =>
                        setInventoryLowStockOnly((active) => !active)
                      }
                    >
                      {inventoryLowStockOnly
                        ? "Show all products"
                        : "Low stock only"}
                    </button>
                    <label className="search-field inventory-search">
                      <Search size={16} />
                      <input
                        value={inventoryQuery}
                        onChange={(event) =>
                          setInventoryQuery(event.target.value)
                        }
                        placeholder="Search name, SKU, supplier..."
                        aria-label="Search inventory"
                      />
                    </label>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>PRODUCT</th>
                        <th>SKU</th>
                        <th>CATEGORY</th>
                        <th>STOCK</th>
                        <th>REORDER</th>
                        <th>STATUS</th>
                        <th>SELLING</th>
                        {canManageInventory && (
                          <>
                            <th>COST</th>
                            <th>WHOLESALE</th>
                            <th>WHOLESALE QTY</th>
                          </>
                        )}
                        <th>SUPPLIER</th>
                        <th>MFT DATE</th>
                        <th>EXPIRY</th>
                        <th>DESCRIPTION</th>
                        {canManageInventory && <th>ACTIONS</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((product) => (
                        <tr
                          key={product.id}
                          className={
                            inventoryLowStockOnly
                              ? "inventory-attention-row"
                              : ""
                          }
                        >
                          <td>
                            <div className="table-product">
                              <ProductArtwork product={product} compact />
                              <strong>{product.name}</strong>
                            </div>
                          </td>
                          <td className="sku-cell">{product.sku}</td>
                          <td>{product.category}</td>
                          <td>{product.stock} units</td>
                          <td>{product.reorderLevel} units</td>
                          <td>
                            <span
                              className={`status-pill ${product.stock === 0 ? "status-out" : product.stock <= product.reorderLevel ? "status-low" : "status-ok"}`}
                            >
                              <i />
                              {product.stock === 0
                                ? "Out of stock"
                                : product.stock <= product.reorderLevel
                                  ? "Low stock"
                                  : "In stock"}
                            </span>
                          </td>
                          <td className="price-cell">{money(product.price)}</td>
                          {canManageInventory && (
                            <>
                              <td>{money(product.costPrice)}</td>
                              <td>{money(product.wholesalePrice)}</td>
                              <td>
                                {product.wholesaleQuantity > 0
                                  ? `${product.wholesaleQuantity}+ units`
                                  : "Not set"}
                              </td>
                            </>
                          )}
                          <td>{product.supplier || "—"}</td>
                          <td>{product.mftDate || "—"}</td>
                          <td>{product.expiryDate || "—"}</td>
                          <td
                            className="inventory-description-cell"
                            title={product.productionDescription || ""}
                          >
                            {product.productionDescription || "—"}
                          </td>
                          {canManageInventory && (
                            <td>
                              <div className="row-actions">
                                {canManageCatalog && (
                                  <button
                                    aria-label={`Edit ${product.name}`}
                                    title="Edit Product"
                                    onClick={() => {
                                      setEditingProduct(product);
                                      setShowProductForm(true);
                                    }}
                                  >
                                    <Pencil size={14} />
                                  </button>
                                )}
                                <button
                                  aria-label={`Manage stock for ${product.name}`}
                                  title="Manage stock"
                                  onClick={() => setStockProduct(product)}
                                >
                                  <PackagePlus size={15} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                      {filteredInventory.length === 0 && (
                        <tr>
                          <td
                            colSpan={canManageInventory ? "15" : "11"}
                            className="table-empty"
                          >
                            {inventoryLowStockOnly
                              ? "No low-stock products match your search."
                              : "No products match your search."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
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
            <>
              <section className="welcome-row">
                <div>
                  <h1>{pageTitle}</h1>
                  <p className="page-subtitle">
                    A clear view of all completed orders.
                  </p>
                </div>
                <div className="report-actions">
                  <button
                    className="secondary-button report-print-action"
                    onClick={printReport}
                    disabled={displayedTransactions.length === 0}
                  >
                    <Printer size={15} /> Print page / Save PDF
                  </button>
                  <button
                    className="primary-button report-screen-action"
                    onClick={() => goToPage("checkout")}
                  >
                    <Plus size={17} /> New Sale
                  </button>
                </div>
              </section>
              <p className="report-print-meta">
                Store: {activeStoreName} · Generated {reportGeneratedAt} ·
                Showing {displayedTransactions.length} of {transactionTotal}{" "}
                matching transactions (page {salesPage})
              </p>
              <section className="inventory-stats sales-metrics">
                <div>
                  <span>Revenue today</span>
                  <strong>{money(todayRevenue)}</strong>
                  <small>from {todaySaleCount} transactions</small>
                </div>
                <div>
                  <span>Orders today</span>
                  <strong>{todaySaleCount}</strong>
                  <small>completed sales</small>
                </div>
                <div>
                  <span>Average order</span>
                  <strong>
                    {money(todaySaleCount ? todayRevenue / todaySaleCount : 0)}
                  </strong>
                  <small>today’s average</small>
                </div>
                <div>
                  <span>All transactions</span>
                  <strong>{allSalesCount}</strong>
                  <small>
                    {user?.role === "cashier" && !isDemo
                      ? "your transactions"
                      : "recorded in the store"}
                  </small>
                </div>
              </section>
              <section className="panel inventory-table-panel sales-report-panel">
                <div className="table-heading">
                  <div>
                    <h2>All transactions</h2>
                    <p>Filter sales by date or search transactions</p>
                  </div>
                  <div className="sales-report-filters">
                    <label className="sales-date-filter">
                      <span>From</span>
                      <input
                        type="date"
                        value={salesDateFrom}
                        max={salesDateTo || undefined}
                        onChange={(event) => {
                          setSalesPage(1);
                          setSalesDateFrom(event.target.value);
                        }}
                        aria-label="From date"
                      />
                    </label>
                    <label className="sales-date-filter">
                      <span>To</span>
                      <input
                        type="date"
                        value={salesDateTo}
                        min={salesDateFrom || undefined}
                        onChange={(event) => {
                          setSalesPage(1);
                          setSalesDateTo(event.target.value);
                        }}
                        aria-label="To date"
                      />
                    </label>
                    {(salesDateFrom || salesDateTo) && (
                      <button
                        type="button"
                        className="sales-date-clear"
                        onClick={() => {
                          setSalesPage(1);
                          setSalesDateFrom("");
                          setSalesDateTo("");
                        }}
                      >
                        Clear dates
                      </button>
                    )}
                    <label className="search-field inventory-search transaction-search">
                      <Search size={16} />
                      <input
                        value={transactionQuery}
                        onChange={(event) => {
                          setSalesPage(1);
                          setTransactionQuery(event.target.value);
                        }}
                        placeholder="Search order, staff, customer, payment..."
                        aria-label="Search transactions"
                      />
                    </label>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>ORDER</th>
                        <th>TIME</th>
                        <th>STAFF</th>
                        <th>CUSTOMER</th>
                        <th>ITEMS</th>
                        <th>PAYMENT</th>
                        <th>STATUS</th>
                        <th>TOTAL</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedTransactions.map((sale) => (
                        <tr key={sale.id}>
                          <td>
                            <strong className="order-id">{sale.id}</strong>
                          </td>
                          <td>
                            {new Intl.DateTimeFormat("en-GH", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }).format(sale.date)}
                          </td>
                          <td>{sale.cashierName ?? "—"}</td>
                          <td>{sale.customerName ?? "Walk-in customer"}</td>
                          <td>
                            {sale.items} {sale.items === 1 ? "item" : "items"}
                          </td>
                          <td>
                            <span className="payment-tag">{sale.method}</span>
                          </td>
                          <td>
                            <span className="status-pill status-ok">
                              <i />
                              <Check size={12} /> Paid
                            </span>
                          </td>
                          <td className="price-cell">{money(sale.total)}</td>
                          <td>
                            <div className="row-actions">
                              <button
                                aria-label={`View transaction ${sale.id}`}
                                title="View transaction"
                                disabled={receiptBusyId === sale.id}
                                onClick={() =>
                                  void openTransactionReceipt(sale)
                                }
                              >
                                <FileText size={14} />
                              </button>
                              <button
                                aria-label={`Reprint receipt ${sale.id}`}
                                title="Reprint receipt"
                                disabled={receiptBusyId === sale.id}
                                onClick={() =>
                                  void openTransactionReceipt(sale, true)
                                }
                              >
                                <Printer size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {displayedTransactions.length === 0 && (
                        <tr>
                          <td colSpan="9" className="table-empty">
                            {transactionTotal === 0
                              ? "No sales have been recorded yet."
                              : "No transactions match your search."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="sales-pagination">
                  <span>
                    {transactionTotal === 0
                      ? "No transactions"
                      : `${(salesPage - 1) * 50 + 1}–${Math.min(salesPage * 50, transactionTotal)} of ${transactionTotal}`}
                  </span>
                  <div>
                    <button
                      type="button"
                      disabled={salesPage <= 1}
                      onClick={() => setSalesPage((current) => current - 1)}
                    >
                      Previous
                    </button>
                    <span>
                      Page {salesPage} of {transactionPages}
                    </span>
                    <button
                      type="button"
                      disabled={salesPage >= transactionPages}
                      onClick={() => setSalesPage((current) => current + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </section>
            </>
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
        <AccessibleDialog
          className="modal-backdrop"
          labelledBy="product-dialog-heading"
          onDismiss={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        >
          <form
            className="product-modal product-modal--wide"
            key={editingProduct?.id ?? "new-product"}
            onSubmit={createProduct}
          >
            <div className="modal-heading">
              <div>
                <h2 id="product-dialog-heading">
                  {editingProduct ? "Edit product" : "Add a Product"}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                onClick={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="product-form-grid">
              <label>
                Product Name
                <input
                  name="name"
                  required
                  maxLength="120"
                  placeholder="e.g. Canvas tote bag"
                  defaultValue={editingProduct?.name ?? ""}
                />
              </label>
              {editingProduct ? (
                <label>
                  SKU
                  <input
                    name="sku"
                    required
                    maxLength="64"
                    pattern={"[A-Za-z0-9][A-Za-z0-9._\\/\\x2d]{0,63}"}
                    title="Use letters, numbers, dots, dashes, underscores, or slashes."
                    defaultValue={editingProduct.sku}
                    readOnly
                  />
                </label>
              ) : null}
              <label>
                Production Description
                <input
                  name="productionDescription"
                  maxLength="2000"
                  placeholder="Add a product description"
                  defaultValue={editingProduct?.productionDescription ?? ""}
                />
              </label>
              <div className="product-supplier-field">
                <label htmlFor="product-category">Category</label>
                <select
                  id="product-category"
                  name="category"
                  required
                  defaultValue={editingProduct?.category ?? ""}
                >
                  <option value="" disabled>
                    Select a Category
                  </option>
                  {inventoryCategories.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="supplier-add-link"
                  onClick={() => setShowCategoryForm(true)}
                >
                  <Plus size={13} /> Add Category
                </button>
              </div>
              <div className="product-supplier-field">
                <label htmlFor="product-supplier">Supplier</label>
                <select
                  id="product-supplier"
                  name="supplierId"
                  defaultValue={editingProduct?.supplierId ?? ""}
                >
                  <option value="">No Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="supplier-add-link"
                  onClick={() => setShowSupplierForm(true)}
                >
                  <Plus size={13} /> Add Supplier
                </button>
              </div>

              {!editingProduct && (
                <div className="product-supplier-field">
                  <label htmlFor="product-opening-stock">Opening Stock</label>
                  <input
                    id="product-opening-stock"
                    name="stock"
                    type="number"
                    min="0"
                    max="1000000"
                    step="1"
                    required
                    placeholder="0"
                    defaultValue="0"
                  />
                </div>
              )}
              <label>
                Reorder Level
                <input
                  name="reorderLevel"
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  required
                  defaultValue={editingProduct?.reorderLevel ?? 5}
                />
              </label>

              <label>
                Selling Price (GHS)
                <input
                  name="price"
                  type="number"
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  required
                  placeholder="0.00"
                  defaultValue={editingProduct?.price ?? ""}
                />
              </label>
              <div className="product-supplier-field">
                <label htmlFor="product-cost-price">Cost Price (GHS)</label>
                <input
                  id="product-cost-price"
                  name="costPrice"
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  required
                  placeholder="0.00"
                  defaultValue={editingProduct?.costPrice ?? ""}
                />
              </div>
              <label>
                Wholesale Price (GHS)
                <input
                  name="wholesalePrice"
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  required
                  placeholder="0.00"
                  defaultValue={editingProduct?.wholesalePrice ?? ""}
                />
              </label>
              <label>
                Wholesale Quantity
                <input
                  name="wholesaleQuantity"
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  defaultValue={editingProduct?.wholesaleQuantity ?? 0}
                />
              </label>

              <label>
                MFT Date
                <input
                  name="mftDate"
                  type="date"
                  defaultValue={editingProduct?.mftDate ?? ""}
                />
              </label>
              <label>
                Expiry Date
                <input
                  name="expiryDate"
                  type="date"
                  defaultValue={editingProduct?.expiryDate ?? ""}
                />
              </label>
            </div>
            {!editingProduct && (
              <div className="product-supplier-field">
                <label htmlFor="product-store">Store</label>
                <select
                  id="product-store"
                  name="storeId"
                  required
                  defaultValue={activeStoreId}
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {storeLabel(store)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                {editingProduct ? <Check size={16} /> : <Plus size={16} />}
                {editingProduct ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </form>
        </AccessibleDialog>
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
